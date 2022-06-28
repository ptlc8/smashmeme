"use strict";
var InputsManager = (function() {
    // keys : paires de touches (MouseButton1, KeyE, Space, GamepadButton5 etc. ; GamepadAxe1, MouseMoveX etc.) et d'entrée (jump, grab etc. ; ou +moveX, -moveX etc. pour les axes en 2 boutons)
    class InputsManager {
        constructor(keys, htmlElement = document) {
            this.keys = keys;
            this.keyboard = {};
            this.mouse = {buttons:[]};
            this.inputs = {};
            this.hasGamepad = navigator.getGamepads()[0]!=null;
            this.scanResolve = null;
            for (let key of keys) {
                this.inputs[key[1]] = { pressed: false, clicked: false, value: 0 , exvalue: 0, expressed: false };
                if (key[1].startsWith("+") || key[1].startsWith("-"))
                    this.inputs[key[1].substring(1)] = { pressed: false, clicked: false, value: 0 , exvalue: 0, expressed: false };
            }
            // clavier
            htmlElement.addEventListener("keydown", (e) => {
                this.onKey(e.code);
                for (const key of this.keys) {
                    if (key[0] == e.code)
                        this.keyboard[key[0]] = true;
                }
            });
            htmlElement.addEventListener("keyup", (e) => {
                for (const key of this.keys) {
                    if (key[0] == e.code)
                        this.keyboard[key[0]] = false;
                }
            });
            // souris
            htmlElement.addEventListener("mousedown", (e) => {
                this.onKey("MouseButton" + e.button);
                this.mouse.buttons[e.button] = true;
            });
            htmlElement.addEventListener("mouseup", (e) => {
                this.mouse.buttons[e.button] = false;
            });
            htmlElement.addEventListener("mousemove", (e) => {
                if (e.movementX != 0)
                    this.onKey("Mouse"+(e.buttons%2==1?"Grab":"")+"MoveX", true);
                if (e.movementY != 0)
                    this.onKey("Mouse"+(e.buttons%2==1?"Grab":"")+"MoveY", true);
                for (let key of this.keys) {
                    if (key[0] == "MouseMoveX")
                        this.inputs[key[1]].value += e.movementX / 50;
                    if (key[0] == "MouseMoveY")
                        this.inputs[key[1]].value += e.movementY / 50;
                    if (e.buttons % 2 == 1 && key[0] == "MouseGrabMoveX")
                        this.inputs[key[1]].value += e.movementX / 50;
                    if (e.buttons % 2 == 1 && key[0] == "MouseGrabMoveY")
                        this.inputs[key[1]].value += e.movementY / 50;
                }
            });
            // manette
            window.addEventListener("gamepadconnected", (e) => {
                if (e.gamepad.index == 0)
                    this.hasGamepad = true;
            });
            window.addEventListener("gamepaddisconnected", (e) => {
                if (e.gamepad.index == 0)
                    this.hasGamepad = false;
            });
        }
        getInputs() {
            // récupération gamepad 1
            var gamepad = (navigator.getGamepads ? navigator.getGamepads() : [])[0];
            for (const key of this.keys) {
                // clics souris
                if (key[0].startsWith("MouseButton")) {
                    var button = (key[0].substring(11));
                    if (this.mouse.buttons[button]) {
                        if (!this.inputs[key[1]].expressed)
                            this.inputs[key[1]].clicked = true;
                        this.inputs[key[1]].pressed = true;
                        this.inputs[key[1]].value = 1;
                    }
                }
                // boutons manette
                else if (gamepad && key[0].startsWith("GamepadButton")) {
                    var button = (key[0].substring(13));
                    if (gamepad.buttons[button].pressed) {
                        if (!this.inputs[key[1]].expressed)
                            this.inputs[key[1]].clicked = true;
                        this.inputs[key[1]].pressed = true;
                        this.inputs[key[1]].value = 1;
                    }
                }
                // axes manette
                else if (gamepad && key[0].startsWith("GamepadAxis")) {
                    var axis = (key[0].substring(11));
                    var value = Math.round(gamepad.axes[axis] * 50) / 50;
                    if (value != 0) {
                        this.inputs[key[1]].pressed = true;
                        this.inputs[key[1]].value = value;
                    }
                }
                else if (gamepad && key[0].startsWith("-GamepadAxis")) {
                    var axis = (key[0].substring(12));
                    var value = Math.round(gamepad.axes[axis] * 50) / 50;
                    if (value < 0) {
                        if (!this.inputs[key[1]].expressed)
                            this.inputs[key[1]].clicked = true;
                        this.inputs[key[1]].pressed = true;
                        this.inputs[key[1]].value = value;
                    }
                }
                else if (gamepad && key[0].startsWith("+GamepadAxis")) {
                    var axis = (key[0].substring(12));
                    var value = Math.round(gamepad.axes[axis] * 50) / 50;
                    if (value > 0) {
                        if (!this.inputs[key[1]].expressed)
                            this.inputs[key[1]].clicked = true;
                        this.inputs[key[1]].pressed = true;
                        this.inputs[key[1]].value = value;
                    }
                }
                // clavier
                else if (!key[0].startsWith("Mouse") && !key[0].startsWith("Grab")) {
                    if (this.keyboard[key[0]]) {
                        if (!this.inputs[key[1]].expressed)
                            this.inputs[key[1]].clicked = true;
                        this.inputs[key[1]].pressed = true;
                        this.inputs[key[1]].value = 1;
                    }
                }
            }
            // simulated axes
            for (const [name, input] of Object.entries(this.inputs)) {
                if (!input.pressed)
                    continue;
                if (name.startsWith("+")) {
                    this.inputs[name.slice(1)].value += 1;
                } else if (name.startsWith("-")) {
                    this.inputs[name.slice(1)].value -= 1;
                }
            }
            // clicked with axes
            for (const [name, input] of Object.entries(this.inputs)) {
                if (input.value != 0 && sign(input.value) != sign(input.exvalue)) {
                    input.clicked = true;
                }
            }
            var inputsToSend = JSON.parse(JSON.stringify(this.inputs));
            // unclicks et unaxes
            for (const [name, input] of Object.entries(this.inputs)) {
                input.clicked = false;
                input.exvalue = input.value;
                input.value = 0;
                input.expressed = input.pressed;
                input.pressed = false;
            }
            // return
            return inputsToSend;
        }
        getInputNames(input) {
            return this.keys.filter(function(key){
                return key[1]==input || key[1]=="-"+input || key[1]=="+"+input;
            }).map(function(key){
                return key[0];
            });
        }
        onKey(key, axis=false) {
            if (this.scanResolve) {
                this.scanResolve(key);
                this.scanResolve = null;
            }
        }
        scan() {
            var that = this;
            return new Promise(function(resolve, reject) {
                that.scanResolve = resolve;
            });
        }
    }

    // private
    var sign = function(x) {
        return x>0?1:x<0?-1:0;
    };

    // static
    var vibrate = function(duration=200, strongMagnitude=1.0, weakMagnitude=1.0) {
        var gamepad = (navigator.getGamepads?navigator.getGamepads():[])[0];
        if (gamepad) {
            if (gamepad.vibrationActuator)
                gamepad.vibrationActuator.playEffect("dual-rumble", {duration,strongMagnitude,weakMagnitude});
            if (gamepad.hapticActuators)
                gamepad.hapticActuators[0].pulse(strongMagnitude, duration);
        }
    };
    InputsManager.vibrate = vibrate;
    // static
    var getKeyName = function(key) {
        return key;
    };
    InputsManager.getKeyName = getKeyName;

    return InputsManager;
})();