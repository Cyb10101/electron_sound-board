'use strict';

class PredefinedSounds {
    getSounds() {
        return {
            'ba-da-dum': {
                name: 'Ba Da Dum',
                sound: 'ba-da-dum.wav',
                icon: 'fas fa-drum',
                soundLicence: this.getLicence('CC BY 3.0', 'Simon_Lacelle', 'https://freesound.org/people/Simon_Lacelle/sounds/37215/'),
                imageLicence: this.getLicence('Font Awesome Free')
            },
            'sad-trombone-01': {
                name: 'Sad Trombone 01',
                sound: 'sad-trombone-01.wav',
                // icon: 'fas fa-drum',
                soundLicence: this.getLicence('CC BY 3.0', 'Benboncan', 'https://freesound.org/people/Benboncan/sounds/73581/'),
                imageLicence: this.getLicence('Font Awesome Free')
            },
            'weapon-science-fiction-01': {
                name: 'Weapon Science Fiction 01',
                sound: 'weapon-science-fiction-01.mp3',
                image: 'weapon-military-01.svg',
                soundLicence: this.getLicence('ZapSplat: Standard License', 'ZapSplat', 'https://www.zapsplat.com/music/science-fiction-weapon-gun-shoot-powerful-1/'),
                imageLicence: this.getLicence('IconFinder: Free for commercial use', 'ibrandify', 'https://www.iconfinder.com/icons/2969374/gun_military_weapon_icon')
            }
        };
    }

    getSound(id) {
        let sounds = this.getSounds();
        if (sounds.hasOwnProperty(id)) {
            return sounds[id];
        }
        return null;
    }

    getLicence(id, author = '', origin = '') {
        let licences = {
            'Font Awesome Free': {
                name: 'Font Awesome Free',
                url: 'https://fontawesome.com/license/free'
            },
            'CC BY 3.0': {
                name: 'CC BY 3.0',
                url: 'https://creativecommons.org/licenses/by/3.0/'
            },
            'ZapSplat: Standard License': {
                name: 'Standard License',
                url: 'https://www.zapsplat.com/license-type/standard-license/'
            },
            'IconFinder: Free for commercial use': {
                name: 'Free for commercial use',
                url: 'http://support.iconfinder.com/en/articles/2184390-introduction-to-licenses-on-iconfinder'
            }
        };

        if (licences.hasOwnProperty(id)) {
            let licence = licences[id];
            licence.id = id;
            licence.author = author;
            licence.origin = origin;
            return licence;
        }
        return null;
    }
}

export const predefinedSounds = new PredefinedSounds();
