# Raspberry Pi + Dotstar + WebSocket Testproject

This is a test project with the Raspberry Pi 3 and (in my case) Adafruit Dotstar Ledstrip with 17 LEDs. Running this application will create a simple webserver on port 8080. With the simple webpage you are able to control the colors and brightness of the LEDs on the strip. Sliders are available for Red, Green, Blue, Intensity, Amount, Hue, Saturation and Brightness.

### Example
Youtube exampe video over [here](https://youtu.be/LVlzwz-5Jfc)

## Installation
- run `npm install` in the root folder of the application
- change `PORT` on line 4 in `app.js` to a prefered port-number


### On a Raspberry Pi with Dotstar LEDs
Make sure you have your Dotstar ledstrip correctly connected to the raspberry pi. 
- 5V on one of the 5V pins
- Data (DI) on pin GPIO 10
- Clock (CI) on pin GPIO 11
- GND on a Ground pin

Make sure `IS_PI=true` on line 2 in `app.js`
Set `LEDSTRIP_LENGTH` on line 3 in `app.js` on the total amount of LEDs you have connected to the Pi.

### Without Dotstar LEDs (for testing)
It is possible to run the app without LEDs. In this case changes to the colors will be shown in the console.

Make sure `IS_PI=false` on line 2 in `app.js`


## Usage
You need sudo permissions to access the SPI ports on the Raspberry Pi. Run `sudo node app.js` in the root folder of the application. Go in your browser to the ip + port-number (e.g. `http://192.168.1.20:8080`) of your device and enjoy!
