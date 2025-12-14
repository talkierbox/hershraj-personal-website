/*
  Personal slideshow registry

  Edit this list to control which photos show up + in what order.
  - src: path under /public (usually /photos/...) 
  - caption: short caption shown under the image
  - alt: accessibility text (optional; falls back to caption)
  - fit: optional: 'contain' (default) | 'cover'
  - position: optional: CSS object-position (e.g. '50% 20%')
*/

window.PERSONAL_SLIDESHOW = [
  {
    src: '/photos/batman.png',
    caption: 'Batman hiding in a random hotel in Italy',
    alt: 'Batman',
    fit: 'contain',
  },
  {
    src: '/photos/deathgrips.jpg',
    caption: 'Rowdy crowd at a Death Grips show in Los Angeles',
    alt: 'Death Grips',
    fit: 'contain',
  },
  {
    src: '/photos/vipassana.jpg',
    caption: 'Fresh out of a 10-day Vipassana meditation retreat',
    alt: 'Vipassana',
    fit: 'contain',
  },
  {
    src: '/photos/beard.jpg',
    caption: 'My beard after a month of not shaving. Note that I was only 18 in this photo',
    alt: 'Beard',
    fit: 'contain',
  },
  {
    src: '/photos/jpn.jpg',
    caption: 'Grabbing Boba with my friends from Japan',
    alt: 'FriendsJpn',
    fit: 'contain',
  },
  {
    src: '/photos/bald.jpg',
    caption: 'BALD',
    alt: 'BALD',
    fit: 'contain',
  },
  {
    src: '/photos/hackathon.jpg',
    caption: 'Winning a Hackathon with my good friend Alex',
    alt: 'Hackathon',
    fit: 'contain',
  }
];
