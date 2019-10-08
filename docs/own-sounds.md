# Own sounds

There is a Danger Zone area in the software under Settings.

There you can open the configuration in the editor or open the user folder of the software.

Example of a configuration:

```json
{
    "board": [
        {
            "sound": "ba-da-dum"
        }, {
            "sound": "ba-da-dum",
            "icon": "fas fa-flask"
        }, {
            "sound": "ba-da-dum",
            "image": "internal.png"
        }, {
            "sound": "ba-da-dum",
            "image": "internal.svg"
        }, {
            "soundUser": "sounds/external.wav"
        }, {
            "soundUser": "sounds/external.mp3",
            "icon": "fas fa-flask"
        }, {
            "soundUser": "sounds/external.wav",
            "imageUser": "sounds/external.png"
        }, {
            "soundUser": "sounds/external.mp3",
            "imageUser": "sounds/external.svg"
        }
    ]
}
```

The variables `sound`, `icon`, `image` are internal, software conditional and can only be changed to what already exists.
This means that nothing new can be added.

The variables `soundUser`, `imageUser` are external and start at the software user folder.

As `icon` you can use anything that exists from [Font Awesome](https://fontawesome.com/) package.

If you want to change `sound`, use the predefined sounds below.

For `soundUser` you theoretically choose any audio file that is suitable for the web.

For `image` or `imageUser` you theoretically choose any image that is suitable for the web.
I recommend to choose a svg.

## Predefined sounds

Predefined ones which you can use as `sound`.

* ba-da-dum
