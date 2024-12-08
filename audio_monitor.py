import pyaudio
import numpy as np
import tkinter as tk
from tkinter import ttk
import threading
import queue
import time

class AudioMonitor:
    def __init__(self, root, device_name, width=400, height=100):
        self.frame = ttk.LabelFrame(root, text=f"Audio Monitor - {device_name}", padding=5)
        self.canvas = tk.Canvas(self.frame, width=width, height=height, bg='black')
        self.canvas.pack(fill="both", expand=True)
        
        self.width = width
        self.height = height
        self.device_name = device_name
        self.is_running = False
        self.audio_queue = queue.Queue(maxsize=10)  # Limit queue size
        
        # Audio parameters
        self.CHUNK = 1024
        self.FORMAT = pyaudio.paFloat32
        self.CHANNELS = 1
        self.RATE = 44100
        self.p = pyaudio.PyAudio()
        
        # Print available devices for debugging
        print("\nAvailable audio devices:")
        for i in range(self.p.get_device_count()):
            dev = self.p.get_device_info_by_index(i)
            print(f"{i}: {dev['name']} (max_input_channels={dev['maxInputChannels']})")
        
        # Find the device index
        self.device_index = self.get_device_index(device_name)
        print(f"Selected device index for {device_name}: {self.device_index}")
        
        # Draw initial center line
        self.canvas.create_line(0, self.height//2, self.width, self.height//2, 
                              fill='#333333', width=1, tags="center_line")
        
    def get_device_index(self, name):
        # Special case for default microphone
        if name == "Default Microphone":
            try:
                default_input = self.p.get_default_input_device_info()
                return default_input['index']
            except Exception as e:
                print(f"Error getting default input device: {e}")
                return None
            
        # Search for device by name
        for i in range(self.p.get_device_count()):
            device_info = self.p.get_device_info_by_index(i)
            if (name.lower() in device_info['name'].lower() and 
                device_info['maxInputChannels'] > 0):  # Must have input channels
                return i
        return None
        
    def start_monitoring(self):
        if self.is_running or self.device_index is None:
            print(f"Cannot start monitoring for {self.device_name}: {'Already running' if self.is_running else 'No device'}")
            return
            
        print(f"Starting monitoring for {self.device_name} (device index: {self.device_index})")
        self.is_running = True
        
        def audio_callback(in_data, frame_count, time_info, status):
            if self.is_running and status is None:  # Only process if no error
                try:
                    audio_data = np.frombuffer(in_data, dtype=np.float32)
                    # Normalize audio data
                    if len(audio_data) > 0:
                        audio_data = audio_data / max(np.max(np.abs(audio_data)), 1)
                        try:
                            self.audio_queue.put_nowait(audio_data)  # Non-blocking put
                        except queue.Full:
                            self.audio_queue.get_nowait()  # Remove oldest item
                            self.audio_queue.put_nowait(audio_data)
                except Exception as e:
                    print(f"Error in audio callback for {self.device_name}: {str(e)}")
            return (in_data, pyaudio.paContinue)
        
        try:
            self.stream = self.p.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.RATE,
                input=True,
                input_device_index=self.device_index,
                frames_per_buffer=self.CHUNK,
                stream_callback=audio_callback
            )
            print(f"Successfully opened audio stream for {self.device_name}")
            
            def update_display():
                last_update = time.time()
                while self.is_running:
                    try:
                        # Update at most 30 times per second
                        now = time.time()
                        if now - last_update < 1/30:
                            time.sleep(0.001)  # Small sleep to prevent CPU spinning
                            continue
                            
                        audio_data = self.audio_queue.get(timeout=0.1)  # Wait up to 100ms for data
                        if len(audio_data) > 0:
                            self.canvas.after(0, lambda d=audio_data: self.draw_waveform(d))
                            last_update = now
                            
                    except queue.Empty:
                        continue
                    except Exception as e:
                        print(f"Error updating display for {self.device_name}: {str(e)}")
                print(f"Display update loop ended for {self.device_name}")
                        
            self.display_thread = threading.Thread(target=update_display, daemon=True)
            self.display_thread.start()
            
        except Exception as e:
            print(f"Error starting audio monitor for {self.device_name}: {str(e)}")
            self.is_running = False
            
    def draw_waveform(self, audio_data):
        try:
            # Clear previous waveform but keep center line
            self.canvas.delete("waveform")
            
            # Calculate waveform points
            points = []
            step = max(1, len(audio_data) // self.width)
            
            for i in range(0, len(audio_data), step):
                chunk = audio_data[i:i + step]
                if len(chunk) > 0:
                    value = float(np.max(np.abs(chunk)))  # Convert to float for consistent math
                    x = (i // step)
                    # Scale value to use full height and center in window
                    y = int(self.height//2 * (1 - value))
                    points.extend([x, y])
            
            if len(points) >= 4:
                # Draw the waveform
                self.canvas.create_line(points, fill='#00ff00', width=1, smooth=True, tags="waveform")
                # Draw mirror of waveform below center line
                mirror_points = []
                for i in range(0, len(points), 2):
                    x = points[i]
                    y = self.height - points[i+1]  # Mirror around center
                    mirror_points.extend([x, y])
                self.canvas.create_line(mirror_points, fill='#00ff00', width=1, smooth=True, tags="waveform")
                
        except Exception as e:
            print(f"Error drawing waveform for {self.device_name}: {str(e)}")
            
    def stop_monitoring(self):
        if not self.is_running:
            return
            
        print(f"Stopping monitoring for {self.device_name}")
        self.is_running = False
        
        if hasattr(self, 'stream'):
            try:
                self.stream.stop_stream()
                self.stream.close()
                print(f"Successfully closed audio stream for {self.device_name}")
            except Exception as e:
                print(f"Error stopping stream for {self.device_name}: {str(e)}")
            
    def pack(self, **kwargs):
        self.frame.pack(**kwargs)
