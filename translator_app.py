import tkinter as tk
from tkinter import ttk, scrolledtext
import os
from dotenv import load_dotenv
import azure.cognitiveservices.speech as speechsdk
import threading
import time
import sys
import platform
from audio_monitor import AudioMonitor
import pyaudio

# Load environment variables
load_dotenv()

class TranslatorApp:
    def __init__(self, root):
        print("Initializing GUI...")
        self.root = root
        self.root.title("Real-Time Speech Translator")
        self.root.geometry("800x800")
        
        # Keep track of the recognition thread
        self.recognition_thread = None
        self.current_recognition = None
        self.current_line = None  # Track the current line being updated
        
        # Configure window for macOS
        if platform.system() == 'Darwin':
            self.root.createcommand('tk::mac::ReopenApplication', self.root.lift)
            
        # Handle window close
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        # Variables
        self.is_running = False
        self.translation_recognizer = None
        self.input_language = tk.StringVar(value="en-US")
        self.output_language = tk.StringVar(value="yue")
        self.audio_source = tk.StringVar(value="microphone")
        
        self.setup_gui()
        
        # Start audio monitors immediately
        self.mic_monitor.start_monitoring()
        self.blackhole_monitor.start_monitoring()
        
    def setup_gui(self):
        # Create all frames first
        self.lang_frame = ttk.LabelFrame(self.root, text="Language Settings", padding=10)
        self.source_frame = ttk.LabelFrame(self.root, text="Audio Source", padding=10)
        self.monitors_frame = ttk.Frame(self.root, padding=10)
        self.control_frame = ttk.Frame(self.root, padding=10)
        self.display_frame = ttk.Frame(self.root, padding=10)
        
        # Pack all frames
        self.lang_frame.pack(fill="x", padx=10, pady=5)
        self.source_frame.pack(fill="x", padx=10, pady=5)
        self.monitors_frame.pack(fill="x", padx=10, pady=5)
        self.control_frame.pack(fill="x", padx=10, pady=5)
        self.display_frame.pack(fill="both", expand=True, padx=10, pady=5)
        
        # Language Selection
        input_langs = ["en-US", "en-GB", "zh-CN", "ja-JP", "ko-KR"]
        output_langs = ["yue", "zh-Hans", "ja", "ko", "en"]
        
        # Create language selection widgets
        ttk.Label(self.lang_frame, text="Input Language:").grid(row=0, column=0, padx=5)
        input_combo = ttk.Combobox(self.lang_frame, textvariable=self.input_language, values=input_langs, state="readonly")
        input_combo.grid(row=0, column=1, padx=5)
        
        ttk.Label(self.lang_frame, text="Output Language:").grid(row=0, column=2, padx=5)
        output_combo = ttk.Combobox(self.lang_frame, textvariable=self.output_language, values=output_langs, state="readonly")
        output_combo.grid(row=0, column=3, padx=5)
        
        # Audio Source Selection
        ttk.Radiobutton(self.source_frame, text="Microphone", value="microphone", variable=self.audio_source).pack(side="left", padx=10)
        ttk.Radiobutton(self.source_frame, text="Blackhole 2ch", value="blackhole", variable=self.audio_source).pack(side="left", padx=10)
        ttk.Radiobutton(self.source_frame, text="Both", value="both", variable=self.audio_source).pack(side="left", padx=10)
        
        # Audio Monitors
        self.mic_monitor = AudioMonitor(self.monitors_frame, "Default Microphone")
        self.mic_monitor.pack(side="left", padx=5, fill="both", expand=True)
        
        self.blackhole_monitor = AudioMonitor(self.monitors_frame, "BlackHole 2ch")
        self.blackhole_monitor.pack(side="right", padx=5, fill="both", expand=True)
        
        # Control Buttons
        self.start_button = ttk.Button(self.control_frame, text="Start Recognition", command=self.toggle_recognition)
        self.start_button.pack(side="left", padx=5)
        
        ttk.Button(self.control_frame, text="Clear History", command=self.clear_history).pack(side="left", padx=5)
        
        # Recognition Text
        self.recognition_text = scrolledtext.ScrolledText(self.display_frame, height=10, width=70, wrap=tk.WORD)
        self.recognition_text.pack(fill="both", expand=True)
        
    def toggle_recognition(self):
        if not self.is_running:
            self.start_recognition()
            self.start_button.configure(text="Stop Recognition")
        else:
            self.stop_recognition()
            self.start_button.configure(text="Start Recognition")
            
    def start_recognition(self):
        if self.is_running:
            return
            
        self.is_running = True
        self.start_button.configure(text="Stop Recognition", state="disabled")
        
        def recognition_thread():
            try:
                # Configure speech translation
                speech_config = speechsdk.translation.SpeechTranslationConfig(
                    subscription=os.getenv('SPEECH_KEY'),
                    region=os.getenv('SPEECH_REGION')
                )
                
                speech_config.speech_recognition_language = self.input_language.get()
                speech_config.add_target_language(self.output_language.get())
                
                # Configure audio source
                audio_config = None
                try:
                    if self.audio_source.get() == "microphone":
                        audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
                    elif self.audio_source.get() == "blackhole":
                        # Use PyAudio to find BlackHole device
                        p = pyaudio.PyAudio()
                        blackhole_index = None
                        
                        for i in range(p.get_device_count()):
                            dev = p.get_device_info_by_index(i)
                            if "BlackHole 2ch" in dev['name'] and dev['maxInputChannels'] > 0:
                                blackhole_index = i
                                break
                                
                        if blackhole_index is None:
                            raise Exception("BlackHole 2ch device not found")
                            
                        # Use the device name from PyAudio
                        device_info = p.get_device_info_by_index(blackhole_index)
                        audio_config = speechsdk.audio.AudioConfig(device_name=device_info['name'])
                        p.terminate()
                        
                    else:  # both
                        # For now, use default microphone as we can only use one input
                        audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
                        print("Multi-source audio not yet implemented, using microphone")
                        
                except Exception as error:
                    error_msg = f"Audio configuration error: {str(error)}\n"
                    self.root.after(0, lambda msg=error_msg: self.update_display(msg, "error"))
                    return
                
                if not audio_config:
                    self.root.after(0, lambda: self.update_display("Failed to configure audio device\n", "error"))
                    return
                
                self.translation_recognizer = speechsdk.translation.TranslationRecognizer(
                    translation_config=speech_config,
                    audio_config=audio_config
                )
                
                def handle_recognizing(event):
                    result = event.result
                    if result.reason == speechsdk.ResultReason.TranslatingSpeech:
                        translated_text = result.translations[self.output_language.get()]
                        self.root.after(0, lambda: self.update_display(translated_text, "recognizing"))
                
                def handle_recognized(event):
                    result = event.result
                    if result.reason == speechsdk.ResultReason.TranslatedSpeech:
                        translated_text = result.translations[self.output_language.get()]
                        self.root.after(0, lambda: self.update_display(translated_text + "。", "final"))
                
                def handle_canceled(event):
                    self.root.after(0, lambda: self.update_display(f"CANCELED: {event.result.error_details}\n", "error"))
                    self.root.after(0, self.stop_recognition)
                
                # Connect callbacks
                self.translation_recognizer.recognizing.connect(handle_recognizing)
                self.translation_recognizer.recognized.connect(handle_recognized)
                self.translation_recognizer.canceled.connect(handle_canceled)
                
                # Start continuous recognition
                self.translation_recognizer.start_continuous_recognition()
                
                # Keep thread alive while recognition is running
                while self.is_running:
                    time.sleep(0.1)
                
                # Stop recognition when thread ends
                if self.translation_recognizer:
                    self.translation_recognizer.stop_continuous_recognition()
                    
            except Exception as e:
                self.root.after(0, lambda: self.update_display(f"Recognition error: {str(e)}\n", "error"))
            finally:
                self.root.after(0, lambda: self.start_button.configure(text="Start Recognition", state="normal"))
                self.is_running = False
        
        # Start recognition in a separate thread
        self.recognition_thread = threading.Thread(target=recognition_thread, daemon=True)
        self.recognition_thread.start()
        self.root.after(100, lambda: self.start_button.configure(state="normal"))
            
    def stop_recognition(self):
        if self.is_running:
            self.is_running = False
            self.start_button.configure(text="Start Recognition")
            
    def on_closing(self):
        self.stop_recognition()
        self.mic_monitor.stop_monitoring()
        self.blackhole_monitor.stop_monitoring()
        self.root.destroy()
            
    def update_display(self, text, status):
        # Get all text content
        content = self.recognition_text.get("1.0", tk.END).strip()
        lines = content.splitlines()
        
        if status == "recognizing":
            if not lines or lines[-1].endswith('。'):  # No lines or last line is final
                # Start a new line for recognition
                if lines:  # If we have content, add a newline
                    self.recognition_text.insert(tk.END, "\n")
                self.recognition_text.insert(tk.END, text)
                self.current_line = len(lines) if lines else 0
            else:
                # Update the current recognition line
                last_line_start = f"{len(lines)}.0"
                last_line_end = f"{len(lines)}.end"
                self.recognition_text.delete(last_line_start, last_line_end)
                self.recognition_text.insert(last_line_start, text)
            
            # Highlight current recognition
            last_line_start = f"{len(lines) if lines else 1}.0"
            self.recognition_text.tag_remove("recognizing", "1.0", tk.END)
            self.recognition_text.tag_add("recognizing", last_line_start, "end-1c")
            self.recognition_text.tag_config("recognizing")
            
        elif status == "final":
            if not lines or lines[-1].endswith('。'):  # No lines or last line is final
                # Add new line for final result
                if lines:  # If we have content, add a newline
                    self.recognition_text.insert(tk.END, "\n")
                self.recognition_text.insert(tk.END, text)
            else:
                # Replace the current recognition with final result
                last_line_start = f"{len(lines)}.0"
                last_line_end = f"{len(lines)}.end"
                self.recognition_text.delete(last_line_start, last_line_end)
                self.recognition_text.insert(last_line_start, text)
            
            # Remove highlighting from final text
            self.recognition_text.tag_remove("recognizing", "1.0", tk.END)
            
        elif status == "error":
            self.recognition_text.insert(tk.END, "\n" + text)
            last_line_start = f"{len(lines) + 1}.0"
            self.recognition_text.tag_add("error", last_line_start, "end-1c")
            self.recognition_text.tag_config("error", foreground="red")
        
        # Always scroll to see the latest text
        self.recognition_text.see(tk.END)
        
    def clear_history(self):
        self.recognition_text.delete(1.0, tk.END)

if __name__ == "__main__":
    root = tk.Tk()
    app = TranslatorApp(root)
    root.mainloop()
