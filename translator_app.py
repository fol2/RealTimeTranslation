import tkinter as tk
from tkinter import ttk, scrolledtext
import os
import json
from dotenv import load_dotenv
import azure.cognitiveservices.speech as speechsdk
import threading
import time
import platform

# Load environment variables
load_dotenv()

SETTINGS_FILE = "settings.json"

class TranslatorApp:
    def __init__(self, root):
        print("Initializing GUI...")
        self.root = root
        self.root.title("Real-Time Speech Translator")
        
        # Make the window always on top and semi-transparent
        self.root.wm_attributes("-topmost", True)
        self.root.wm_attributes("-alpha", 0.95)
        
        # Dark background and bright text for a modern look
        self.root.configure(bg="#1E1E1E")
        self.root.geometry("700x500")
        
        self.is_running = False
        self.translation_recognizer = None
        self.recognition_thread = None
        
        # Load settings (input_language, output_language, second_output_language)
        self.load_settings()
        
        # Create main UI
        self.create_main_ui()
        
        # Handle window close
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
    def load_settings(self):
        # Default settings if no file found
        default_settings = {
            "input_language": "en-US",
            "output_language": "yue",
            "second_output_language": ""
        }
        
        if os.path.exists(SETTINGS_FILE):
            try:
                with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.input_language = data.get("input_language", default_settings["input_language"])
                self.output_language = data.get("output_language", default_settings["output_language"])
                self.second_output_language = data.get("second_output_language", default_settings["second_output_language"])
            except:
                self.input_language = default_settings["input_language"]
                self.output_language = default_settings["output_language"]
                self.second_output_language = default_settings["second_output_language"]
        else:
            self.input_language = default_settings["input_language"]
            self.output_language = default_settings["output_language"]
            self.second_output_language = default_settings["second_output_language"]
        
    def save_settings(self):
        data = {
            "input_language": self.input_language,
            "output_language": self.output_language,
            "second_output_language": self.second_output_language
        }
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        
    def create_main_ui(self):
        # Style configuration for ttk
        style = ttk.Style(self.root)
        style.configure("TButton", background="#3C3C3C", foreground="#FFFFFF", padding=6)
        style.configure("TLabel", background="#1E1E1E", foreground="#FFFFFF")
        style.configure("TFrame", background="#1E1E1E")
        
        # Top control frame
        control_frame = ttk.Frame(self.root)
        control_frame.pack(side=tk.TOP, fill=tk.X, pady=10, padx=10)
        
        # Start / Stop Button
        self.start_button = ttk.Button(control_frame, text="Start", command=self.toggle_recognition)
        self.start_button.pack(side=tk.LEFT, padx=(0,10))
        
        # Clear History Button
        self.clear_button = ttk.Button(control_frame, text="Clear History", command=self.clear_history)
        self.clear_button.pack(side=tk.LEFT, padx=(0,10))
        
        # Settings icon (gear)
        # Using a unicode gear icon "⚙️", or ASCII fallback
        settings_button = ttk.Button(control_frame, text="⚙️", command=self.open_settings_window)
        settings_button.pack(side=tk.RIGHT)
        
        # Transcription display
        self.recognition_text = scrolledtext.ScrolledText(
            self.root, 
            height=10,
            wrap=tk.WORD, 
            font=("Helvetica", 16), 
            bg="#2D2D2D", 
            fg="#FFFFFF",
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
            
            # Initialize the text mark at the end of the text widget
            self.recognition_text.mark_set("current_recognition_start", tk.END)
            
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
            
            # Set the input and target languages
            speech_config.speech_recognition_language = self.input_language
            
            # Add the target languages (for bilingual)
            target_langs = []
            if self.output_language:
                target_langs.append(self.output_language)
            if self.second_output_language and self.second_output_language.strip():
                target_langs.append(self.second_output_language)
            
            # Add them to config
            for lang in target_langs:
                speech_config.add_target_language(lang)

            # On macOS and other platforms, rely on default input device
            print("Using default microphone (system default input).")
            audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
            
            self.translation_recognizer = speechsdk.translation.TranslationRecognizer(
                translation_config=speech_config,
                audio_config=audio_config
            )
            
            def handle_recognizing(event):
                result = event.result
                if result.reason == speechsdk.ResultReason.TranslatingSpeech:
                    # We have original text and possibly multiple translations
                    original_text = result.text
                    translations = result.translations
                    
                    self.root.after(0, lambda: self.update_bilingual_display(original_text, translations, "recognizing"))
            
            def handle_recognized(event):
                result = event.result
                if result.reason == speechsdk.ResultReason.TranslatedSpeech:
                    original_text = result.text
                    translations = result.translations
                    # final result
                    self.root.after(0, lambda: self.update_bilingual_display(original_text, translations, "final"))
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
    
    def update_bilingual_display(self, original_text, translations, status):
        # Build the text block
        text_block = f"Original ({self.input_language}): {original_text}"
        for lang, trans in translations.items():
            text_block += f"\nTranslation ({lang}): {trans}"

        if status == "recognizing":
            # If there's a currently displayed partial line, remove it first
            if self.recognition_text.tag_ranges("current_recognition"):
                self.recognition_text.delete("current_recognition.first", "current_recognition.last")

            # Insert a new line with the current partial recognition at the end
            start_index = self.recognition_text.index(tk.END)
            # If there's already text, insert a newline first so each partial is on its own line
            if self.recognition_text.index(tk.END) != "1.0":
                self.recognition_text.insert(tk.END, "\n")
            self.recognition_text.insert(tk.END, text_block)
            
            end_index = self.recognition_text.index(tk.END)
            # Tag this newly inserted text as the current partial recognition
            self.recognition_text.tag_add("current_recognition", start_index, end_index)

        else:  # "final"
            # On final recognition, finalize the current partial line
            if self.recognition_text.tag_ranges("current_recognition"):
                # Just remove the tag; we keep the text as is since it's now final
                self.recognition_text.tag_remove("current_recognition", "current_recognition.first", "current_recognition.last")

            # Add a newline ready for the next recognition sequence
            self.recognition_text.insert(tk.END, "\n")

        self.recognition_text.see(tk.END)
        
    def update_display(self, text, status):
        # For simple error messages or direct inserts
        content = self.recognition_text.get("1.0", tk.END).strip()
        lines = content.splitlines()
        
        if status == "error":
            self.recognition_text.insert(tk.END, "\n" + text)
        else:
            # Just append text
            if lines:
                self.recognition_text.insert(tk.END, "\n" + text)
            else:
                self.recognition_text.insert(tk.END, text)
        
        self.recognition_text.see(tk.END)
        
    def clear_history(self):
        self.recognition_text.delete(1.0, tk.END)
    
    def open_settings_window(self):
        # Use Entry widgets instead of Comboboxes
        settings_win = tk.Toplevel(self.root)
        settings_win.title("Settings")
        settings_win.geometry("300x250")
        settings_win.transient(self.root)
        settings_win.grab_set()
        
        ttk.Label(settings_win, text="Input Language (e.g., en-US):").pack(pady=5)
        input_entry = ttk.Entry(settings_win)
        input_entry.insert(0, self.input_language)
        input_entry.pack(pady=5)
        
        ttk.Label(settings_win, text="Output Language (e.g., yue):").pack(pady=5)
        output_entry = ttk.Entry(settings_win)
        output_entry.insert(0, self.output_language)
        output_entry.pack(pady=5)
        
        ttk.Label(settings_win, text="Second Output Language (optional, e.g., ja):").pack(pady=5)
        second_output_entry = ttk.Entry(settings_win)
        second_output_entry.insert(0, self.second_output_language)
        second_output_entry.pack(pady=5)
        
        def apply_settings():
            self.input_language = input_entry.get()
            self.output_language = output_entry.get()
            self.second_output_language = second_output_entry.get()
            self.save_settings()
            settings_win.destroy()
        
        apply_button = ttk.Button(settings_win, text="Save & Close", command=apply_settings)
        apply_button.pack(pady=10)

if __name__ == "__main__":
    root = tk.Tk()
    app = TranslatorApp(root)
    root.mainloop()