#include <memory>
#include <node.h>
#include <termios.h>
#include <unistd.h>

static std::unique_ptr<termios> saved_termios;

static void enter_raw_mode(const v8::FunctionCallbackInfo<v8::Value> &args) {
    // save the termios before, just once
    if (!saved_termios) {
        saved_termios = std::make_unique<termios>();
        tcgetattr(STDIN_FILENO, saved_termios.get());
    }

    // set the raw mode
    termios raw_termios;
    cfmakeraw(&raw_termios);
    tcsetattr(STDIN_FILENO, TCSANOW, &raw_termios);
}

static void leave_raw_mode(const v8::FunctionCallbackInfo<v8::Value> &args) {
    // restore the saved termios only if present
    if (saved_termios) {
        tcsetattr(STDIN_FILENO, TCSANOW, saved_termios.get());
    }
}

static void initialize(v8::Local<v8::Object> exports) {
    NODE_SET_METHOD(exports, "enterRawMode", enter_raw_mode);
    NODE_SET_METHOD(exports, "leaveRawMode", leave_raw_mode);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, initialize)
