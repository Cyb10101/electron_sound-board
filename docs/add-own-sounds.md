# Add own sounds

There is a Danger Zone area in the software under Settings.

There you can open the configuration (`config.json`) in the editor or open the `user data folder` of the software.

*Note: If you edit the configuration incorrectly and there is a bug in it, everything will be reset to default.*

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
            "imageUser": "images/external.png"
        }, {
            "soundUser": "sounds/external.mp3",
            "imageUser": "images/external.svg"
        }
    ]
}
```

The variables `sound`, `icon`, `image` are internal, software conditional and can only be changed to what already exists.
This means that nothing new can be added.

The variables `soundUser`, `imageUser` are external and start at the software user folder.

As `icon` you can use anything that exists from [Font Awesome](https://fontawesome.com/) free package.

If you want to change `sound`, use the predefined sounds below.

For `soundUser` you theoretically choose any audio file that is suitable for the web.

For `image` or `imageUser` you theoretically choose any image that is suitable for the web.
I recommend to choose a svg.

## Predefined sounds

Predefined ones which you can use as `sound`.

* ba-da-dum
* weapon-science-fiction-01

*Note: Possibly not updated. But should always be complete in the reset of the app.*
