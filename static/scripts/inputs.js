"use strict";
var InputsManager = (function() {
    // keys : [key,input][][], tableau de tableau de paires de touches (MouseButton1, KeyE, Space, GamepadButton5 etc. ; GamepadAxe1, MouseMoveX etc.) et d'entrée (jump, grab etc. ; ou +moveX, -moveX etc. pour les axes en 2 boutons)
    class InputsManager {
        constructor(keys, multiplayer=false, htmlElement = document) {
            this.keys = keys;
            this.keyboard = {};
            this.mouse = {buttons:[], move:[0,0], grabmove:[0,0]};
            this.inputs = {};
            this.gamepads = [];
            this.scanResolve = null;
            this.onInput = null;
            for (const [index,keys] of this.keys.entries()) { 
                this.inputs[index] = {};
                for (let key of keys) {
                    this.inputs[index][key[1]] = { pressed: false, clicked: false, value: 0 , exvalue: 0, expressed: false };
                    if (key[1].startsWith("+") || key[1].startsWith("-"))
                        this.inputs[index][key[1].substring(1)] = { pressed: false, clicked: false, value: 0 , exvalue: 0, expressed: false };
                }
            }
            // clavier
            htmlElement.addEventListener("keydown", (e) => {
                if (this.keyboard[e.code]) return;
                this.onKey("keyboard", e.code, 1, false);
                //for (const key of this.keys) {
                    //if (key[0] == e.code)
                        this.keyboard[e.code] = true;
                //}
            });
            htmlElement.addEventListener("keyup", (e) => {
                this.onKey("keyboard", e.code, 0, false);
                //for (const key of this.keys) {
                    //if (key[0] == e.code)
                        this.keyboard[e.code] = false;
                //}
            });
            // souris
            htmlElement.addEventListener("mousedown", (e) => {
                this.onKey("mouse", "Button"+e.button, 1, false);
                this.mouse.buttons[e.button] = true;
            });
            htmlElement.addEventListener("mouseup", (e) => {
                this.onKey("mouse", "Button"+e.button, 0, false);
                this.mouse.buttons[e.button] = false;
            });
            htmlElement.addEventListener("mousemove", (e) => {
                this.onKey("mouse", (e.buttons%2==1?"Grab":"")+"MoveX", e.movementX/50, true);
                this.onKey("mouse", (e.buttons%2==1?"Grab":"")+"MoveY", e.movementY/50, true);
                //for (let key of this.keys) {
                    if (e.buttons % 2 != 1/* && key[0] == "MouseMoveX"*/)
                        this.mouse.move[0] += e.movementX / 50;
                    if (e.buttons % 2 != 1/* && key[0] == "MouseMoveY"*/)
                        this.mouse.move[1] += e.movementY / 50;
                    if (e.buttons % 2 == 1/* && key[0] == "MouseGrabMoveX"*/)
                        this.mouse.grabmove[0] += e.movementX / 50;
                    if (e.buttons % 2 == 1/* && key[0] == "MouseGrabMoveY"*/)
                        this.mouse.grabmove[1] += e.movementY / 50;
                //}
            });
            // manette
            window.addEventListener("gamepadconnected", (e) => {
                var index = e.gamepad.index;
                var intervalId = setInterval(() => {
                    var gamepad = navigator.getGamepads()[index];
                    for (let i = 0; i < gamepad.buttons.length; i++) {
                        if (this.gamepads[index].buttons[i] != gamepad.buttons[i].value)
                            this.onKey("gamepad"+index, "Button"+i, gamepad.buttons[i].value, false);
                        this.gamepads[index].buttons[i] = gamepad.buttons[i].value;
                    }
                    for (let i = 0; i < gamepad.axes.length; i++) {
                        var value = Math.round(gamepad.axes[i]*50) / 50;
                        if (this.gamepads[index].axes[i] != value)
                            this.onKey("gamepad"+index, "Axis"+i, value, true);
                        this.gamepads[index].axes[i] = value;
                    }
                }, 1000 / 60);
                this.gamepads[index] = {intervalId, buttons:[], axes:[]};
            });
            window.addEventListener("gamepaddisconnected", (e) => {
                var index = e.gamepad.index;
                clearInterval(this.gamepads[index].intervalId);
                delete this.gamepads[index];
            });
        }
        getInputs() {
            // récupération gamepad 1
            var gamepad = (navigator.getGamepads ? navigator.getGamepads() : [])[0];
            for (const [index,keys] of this.keys.entries()) {
                for (let key of keys) {
                    // clics souris
                    if (key[0].startsWith("MouseButton")) {
                        var button = (key[0].substring(11));
                        if (this.mouse.buttons[button]) {
                            if (!this.inputs[index][key[1]].expressed)
                                this.inputs[index][key[1]].clicked = true;
                            this.inputs[index][key[1]].pressed = true;
                            this.inputs[index][key[1]].value = 1;
                        }
                    }
                    // boutons manette
                    else if (gamepad && key[0].startsWith("GamepadButton")) {
                        var button = (key[0].substring(13));
                        if (gamepad.buttons[button].pressed) {
                            if (!this.inputs[index][key[1]].expressed)
                                this.inputs[index][key[1]].clicked = true;
                            this.inputs[index][key[1]].pressed = true;
                            this.inputs[index][key[1]].value = 1;
                        }
                    }
                    // mouvements souris
                    else if (key[0].startsWith("MouseMove")) {
                        var axis = (key[0].substring(9));
                        var value = this.mouse.move[axis];
                        if (value != 0) {
                            this.inputs[index][key[1]].pressed = true;
                            this.inputs[index][key[1]].value = value;
                        }
                    }
                    else if (key[0].startsWith("MouseGrabMove")) {
                        var axis = (key[0].substring(13));
                        var value = this.mouse.grabmove[axis];
                        if (value != 0) {
                            this.inputs[index][key[1]].pressed = true;
                            this.inputs[index][key[1]].value = value;
                        }
                    }
                    // axes manette
                    else if (gamepad && key[0].startsWith("GamepadAxis")) {
                        var axis = (key[0].substring(11));
                        var value = Math.round(gamepad.axes[axis] * 50) / 50;
                        if (value != 0) {
                            this.inputs[index][key[1]].pressed = true;
                            this.inputs[index][key[1]].value = value;
                        }
                    }
                    else if (gamepad && key[0].startsWith("-GamepadAxis")) {
                        var axis = (key[0].substring(12));
                        var value = Math.round(gamepad.axes[axis] * 50) / 50;
                        if (value < 0) {
                            if (!this.inputs[index][key[1]].expressed)
                                this.inputs[index][key[1]].clicked = true;
                            this.inputs[index][key[1]].pressed = true;
                            this.inputs[index][key[1]].value = value;
                        }
                    }
                    else if (gamepad && key[0].startsWith("+GamepadAxis")) {
                        var axis = (key[0].substring(12));
                        var value = Math.round(gamepad.axes[axis] * 50) / 50;
                        if (value > 0) {
                            if (!this.inputs[index][key[1]].expressed)
                                this.inputs[index][key[1]].clicked = true;
                            this.inputs[index][key[1]].pressed = true;
                            this.inputs[index][key[1]].value = value;
                        }
                    }
                    // clavier
                    else if (!key[0].startsWith("Mouse") && !key[0].startsWith("Grab")) {
                        if (this.keyboard[key[0]]) {
                            if (!this.inputs[index][key[1]].expressed)
                                this.inputs[index][key[1]].clicked = true;
                            this.inputs[index][key[1]].pressed = true;
                            this.inputs[index][key[1]].value = 1;
                        }
                    }
                }
                // simulated axes
                for (const [name, input] of Object.entries(this.inputs[index])) {
                    if (!input.pressed)
                        continue;
                    if (name.startsWith("+")) {
                        this.inputs[index][name.slice(1)].value += 1;
                    } else if (name.startsWith("-")) {
                        this.inputs[index][name.slice(1)].value -= 1;
                    }
                }
                // clicked with axes
                for (const [name, input] of Object.entries(this.inputs[index])) {
                    if (input.value != 0 && sign(input.value) != sign(input.exvalue)) {
                        input.clicked = true;
                    }
                }
            }
            var inputsToSend = JSON.parse(JSON.stringify(this.inputs));
            // unclicks et unaxes
            for (let inputs of Object.values(this.inputs)) for (const [name,input] of Object.entries(inputs)) {
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
        onKey(device, key, value, axis=false) {
            if (this.scanResolve) {
                this.scanResolve(device, key, value, axis);
            }
            if (this.onInput)
                for (const [index,keys] of this.keys.entries())
                    for (const keyEntry of keys) {
                        if (keyEntry[0] == device+key || keyEntry[0] == key)
                            this.onInput(index, keyEntry[1], value);
                        if (keyEntry[0] == "+"+device+key)
                            this.onInput(index, keyEntry[1], Math.max(0,value));
                        if (keyEntry[0] == "-"+device+key)
                            this.onInput(index, keyEntry[1], Math.min(0,value));
                    }
        }
        scan(scanForAxis=false) {
            var that = this;
            return new Promise((resolve, reject) => {
                that.scanResolve = function(device, key, value, axis) {
                    if (axis==scanForAxis) {
                        resolve(device+key);
                        this.scanResolve = null;
                    } else if (!scanForAxis && value!=0) {
                        resolve((value>0?"+":"-")+device+key);
                        this.scanResolve = null;
                    }
                }
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