import os
from dotenv import load_dotenv
import azure.cognitiveservices.speech as speechsdk
import time

# Load environment variables from .env file
load_dotenv()

def recognize_from_microphone():
    speech_translation_config = speechsdk.translation.SpeechTranslationConfig(
        subscription=os.getenv('SPEECH_KEY'), 
        region=os.getenv('SPEECH_REGION')
    )
    speech_translation_config.speech_recognition_language="en-GB"

    speech_translation_config.enable_dictation()

    speech_translation_config.set_property(speechsdk.PropertyId.Speech_SegmentationStrategy, "Semantic")
    
    to_language ="yue"
    speech_translation_config.add_target_language(to_language)

    audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
    translation_recognizer = speechsdk.translation.TranslationRecognizer(translation_config=speech_translation_config, audio_config=audio_config)

    done = False

    def stop_cb(evt):
        print('CLOSING on {}'.format(evt))
        translation_recognizer.stop_continuous_recognition()
        nonlocal done
        done = True

    def recognizing_cb(evt):
        print('RECOGNIZING: {}'.format(evt))

    def recognized_cb(evt):
        result = evt.result
        if result.reason == speechsdk.ResultReason.TranslatedSpeech:
            print("Recognized: {}".format(result.text))
            print("Translated into '{}': {}".format(
                to_language, result.translations[to_language]))
        elif result.reason == speechsdk.ResultReason.NoMatch:
            print("No speech could be recognized.")

    def canceled_cb(evt):
        result = evt.result
        print("CANCELED: Reason={}".format(result.reason))
        if result.reason == speechsdk.CancellationReason.Error:
            print("CANCELED: ErrorDetails={}".format(result.error_details))
            print("Did you set the speech resource key and region values?")
        stop_cb(evt)

    translation_recognizer.recognizing.connect(recognizing_cb)
    translation_recognizer.recognized.connect(recognized_cb)
    translation_recognizer.session_started.connect(
        lambda evt: print('SESSION STARTED: {}'.format(evt)))
    translation_recognizer.session_stopped.connect(
        lambda evt: print('SESSION STOPPED {}'.format(evt)))
    translation_recognizer.canceled.connect(canceled_cb)
    translation_recognizer.session_stopped.connect(stop_cb)
    translation_recognizer.canceled.connect(stop_cb)

    print("Speak into your microphone.")
    translation_recognizer.start_continuous_recognition()
    while not done:
        time.sleep(0.5)

recognize_from_microphone()