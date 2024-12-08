import tkinter as tk
from tkinter import ttk, scrolledtext
import os
from dotenv import load_dotenv
import azure.cognitiveservices.speech as speechsdk
import threading
import time
import platform

# Load environment variables
load_dotenv()

class TranslatorApp:
    def __init__(self, root):
        print("Initializing GUI...")
        self.root = root
        self.root.title("Real-Time Speech Translator")
        
        # Make the window always on top and semi-transparent
        self.root.wm_attributes("-topmost", True)
        self.root.wm_attributes("-alpha", 0.85)
        
        # Use a modern, minimal layout
        self.root.configure(bg="#F0F0F0")  # Light background
        self.root.geometry("600x400")

        self.is_running = False
        self.translation_recognizer = None
        self.recognition_thread = None
        
        # Default settings
        self.input_language = "en-US"
        self.output_language = "yue"

        # Create main UI
        self.create_main_ui()
        
        # Bind a shortcut to open settings
        self.root.bind("<Control-s>", self.open_settings_window)

        # Handle window close
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
    def create_main_ui(self):
        # A frame for the control buttons
        control_frame = tk.Frame(self.root, bg="#F0F0F0")
        control_frame.pack(side=tk.TOP, fill=tk.X, pady=10)

        # Start / Stop Button
        self.start_button = ttk.Button(control_frame, text="Start", command=self.toggle_recognition)
        self.start_button.pack(side=tk.LEFT, padx=10)
        
        # Transcription display
        self.recognition_text = scrolledtext.ScrolledText(
            self.root, 
            height=10, 
            wrap=tk.WORD, 
            font=("Helvetica", 16), 
            bg="#FFFFFF", 
            fg="#000000",
            borderwidth=0, 
            highlightthickness=0
        )
        self.recognition_text.pack(fill="both", expand=True, padx=20, pady=20)

    def toggle_recognition(self):
        if self.is_running:
            self.stop_recognition()
        else:
            self.start_recognition()
    
    def start_recognition(self):
        if self.is_running:
            return
            
        try:
            self.is_running = True
            self.start_button.configure(text="Stop", state="disabled")
            
            # Start recognition in a separate thread
            self.recognition_thread = threading.Thread(target=self.recognition_thread_func, daemon=True)
            self.recognition_thread.start()
            self.root.after(100, lambda: self.start_button.configure(state="normal"))
            
        except Exception as e:
            self.update_display(f"Error starting recognition: {str(e)}\n", "error")
            self.is_running = False
            self.start_button.configure(text="Start", state="normal")
            
    def recognition_thread_func(self):
        try:
            # Configure speech translation
            speech_config = speechsdk.translation.SpeechTranslationConfig(
                subscription=os.getenv('SPEECH_KEY'),
                region=os.getenv('SPEECH_REGION')
            )
            
            if not os.getenv('SPEECH_KEY') or not os.getenv('SPEECH_REGION'):
                raise Exception("Speech credentials not found. Please check your .env file.")
            
            speech_config.speech_recognition_language = self.input_language
            to_language = self.output_language
            speech_config.add_target_language(to_language)
            # Optional: add any other properties if needed
            # speech_config.enable_dictation()
            # speech_config.set_property(speechsdk.PropertyId.Speech_SegmentationStrategy, "Semantic")

            # On macOS and other platforms, we rely on default input device
            # Ensure the system default input device is what you want (e.g., BlackHole on macOS)
            print("Using default microphone (system default input device).")
            audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
            
            self.translation_recognizer = speechsdk.translation.TranslationRecognizer(
                translation_config=speech_config,
                audio_config=audio_config
            )
            
            def handle_recognizing(event):
                result = event.result
                if result.reason == speechsdk.ResultReason.TranslatingSpeech:
                    translated_text = result.translations[to_language]
                    self.root.after(0, lambda text=translated_text: self.update_display(text, "recognizing"))
            
            def handle_recognized(event):
                result = event.result
                if result.reason == speechsdk.ResultReason.TranslatedSpeech:
                    translated_text = result.translations[to_language]
                    self.root.after(0, lambda text=translated_text: self.update_display(text + "。", "final"))
                elif result.reason == speechsdk.ResultReason.NoMatch:
                    self.root.after(0, lambda: self.update_display("No speech could be recognized.\n", "error"))
            
            def handle_canceled(event):
                result = event.result
                if result.reason == speechsdk.CancellationReason.Error:
                    error_msg = f"CANCELED: Error={result.error_details}\n"
                    self.root.after(0, lambda msg=error_msg: self.update_display(msg, "error"))
                self.root.after(0, self.stop_recognition)
            
            # Connect callbacks
            self.translation_recognizer.recognizing.connect(handle_recognizing)
            self.translation_recognizer.recognized.connect(handle_recognized)
            self.translation_recognizer.canceled.connect(handle_canceled)
            self.translation_recognizer.session_started.connect(
                lambda evt: print('SESSION STARTED: {}'.format(evt)))
            self.translation_recognizer.session_stopped.connect(
                lambda evt: print('SESSION STOPPED {}'.format(evt)))
            
            # Start continuous recognition
            print("Starting recognition...")
            self.translation_recognizer.start_continuous_recognition()
            
            # Keep thread alive while recognition is running
            while self.is_running:
                time.sleep(0.1)
            
            # Stop recognition when thread ends
            if self.translation_recognizer:
                self.translation_recognizer.stop_continuous_recognition()
                
        except Exception as e:
            error_msg = str(e)
            self.root.after(0, lambda msg=error_msg: self.update_display(f"Recognition error: {msg}\n", "error"))
        finally:
            self.root.after(0, lambda: self.start_button.configure(text="Start", state="normal"))
            self.is_running = False
            
    def stop_recognition(self):
        if self.is_running:
            self.is_running = False
            self.start_button.configure(text="Start")
    
    def on_closing(self):
        self.stop_recognition()
        self.root.destroy()
    
    def update_display(self, text, status):
        content = self.recognition_text.get("1.0", tk.END).strip()
        lines = content.splitlines()
        
        if status == "recognizing":
            if not lines or lines[-1].endswith('。'):
                if lines:
                    self.recognition_text.insert(tk.END, "\n")
                self.recognition_text.insert(tk.END, text)
            else:
                last_line_start = f"{len(lines)}.0"
                last_line_end = f"{len(lines)}.end"
                self.recognition_text.delete(last_line_start, last_line_end)
                self.recognition_text.insert(last_line_start, text)
            
        elif status == "final":
            if not lines or lines[-1].endswith('。'):
                if lines:
                    self.recognition_text.insert(tk.END, "\n")
                self.recognition_text.insert(tk.END, text)
            else:
                last_line_start = f"{len(lines)}.0"
                last_line_end = f"{len(lines)}.end"
                self.recognition_text.delete(last_line_start, last_line_end)
                self.recognition_text.insert(last_line_start, text)
            
        elif status == "error":
            self.recognition_text.insert(tk.END, "\n" + text)
        
        self.recognition_text.see(tk.END)
        
    def open_settings_window(self, event=None):
        # Open a separate settings window when user presses Ctrl+S
        # Here we put all settings (like input_language, output_language)
        # For simplicity, we show just two comboboxes and an apply button.
        
        settings_win = tk.Toplevel(self.root)
        settings_win.title("Settings")
        settings_win.geometry("300x200")
        settings_win.transient(self.root)
        settings_win.grab_set()
        
        tk.Label(settings_win, text="Input Language:").pack(pady=5)
        input_langs = ["en-US", "en-GB", "zh-CN", "ja-JP", "ko-KR"]
        input_combo = ttk.Combobox(settings_win, values=input_langs, state="readonly")
        input_combo.set(self.input_language)
        input_combo.pack(pady=5)
        
        tk.Label(settings_win, text="Output Language:").pack(pady=5)
        output_langs = ["yue", "zh-Hans", "ja", "ko", "en"]
        output_combo = ttk.Combobox(settings_win, values=output_langs, state="readonly")
        output_combo.set(self.output_language)
        output_combo.pack(pady=5)

        def apply_settings():
            self.input_language = input_combo.get()
            self.output_language = output_combo.get()
            settings_win.destroy()
        
        apply_button = ttk.Button(settings_win, text="Apply", command=apply_settings)
        apply_button.pack(pady=10)

if __name__ == "__main__":
    root = tk.Tk()
    app = TranslatorApp(root)
    root.mainloop()