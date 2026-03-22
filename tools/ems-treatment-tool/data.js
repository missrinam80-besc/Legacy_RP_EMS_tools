/**
 * EMS Behandelingsadviseur - data
 * -------------------------------
 * Deze dataset is afgeleid uit de aangeleverde wounds.lua, fractures.lua en medications.lua.
 * Ze vormt de statische basis voor de tool en vervangt een database.
 */

const EMS_DATA = {
  bodyParts: [
    { id: 'leftArm', label: 'Linkerarm' },
    { id: 'rightArm', label: 'Rechterarm' },
    { id: 'leftLeg', label: 'Linkerbeen' },
    { id: 'rightLeg', label: 'Rechterbeen' },
    { id: 'head', label: 'Hoofd' },
    { id: 'torso', label: 'Rompgedeelte' }
  ],

  wounds: {
    none: {
      label: 'Geen letsel',
      bleeding: 0,
      pain: 0,
      needSewing: false,
      notes: []
    },
    abrasion: {
      label: 'Schaafwonde',
      bleeding: 0,
      pain: 0.5,
      needSewing: false,
      notes: ['Oppervlakkig letsel.']
    },
    avulsion: {
      label: 'Avulsie / afgescheurd weefsel',
      bleeding: 0.05,
      pain: 1.0,
      needSewing: true,
      notes: ['Weefselschade met kans op complex wondherstel.']
    },
    contusion: {
      label: 'Kneuzing',
      bleeding: 0,
      pain: 1.0,
      needSewing: false,
      notes: ['Observeer op zwelling en functieverlies.']
    },
    crush: {
      label: 'Verpletteringsletsel',
      bleeding: 0.08,
      pain: 2.0,
      needSewing: false,
      notes: ['Hoge pijn, verhoogde kans op functieverlies.']
    },
    cut: {
      label: 'Snijwonde',
      bleeding: 0.05,
      pain: 0.5,
      needSewing: true,
      notes: ['Nette wondranden mogelijk, wondsluiting vaak aangewezen.']
    },
    laceration: {
      label: 'Scheurwonde',
      bleeding: 0.05,
      pain: 2.0,
      needSewing: true,
      notes: ['Onregelmatige wondranden, reinigen en sluiten.']
    },
    lowvelocitywound: {
      label: 'Lage snelheid kogelwonde',
      bleeding: 0.1,
      pain: 3.0,
      needSewing: true,
      notes: ['Controleer op in- en uittrede en mogelijke interne schade.']
    },
    mediumvelocitywound: {
      label: 'Medium snelheid kogelwonde',
      bleeding: 0.5,
      pain: 3.0,
      needSewing: true,
      notes: ['Ernstige bloeding, snelle stabilisatie vereist.']
    },
    highvelocitywound: {
      label: 'Hoge snelheid kogelwonde',
      bleeding: 0.7,
      pain: 3.0,
      needSewing: true,
      notes: ['Zeer ernstig letsel met verhoogd risico op intern trauma.']
    },
    velocitywound: {
      label: 'Schotwonde / kogelwonde',
      bleeding: 0.3,
      pain: 3.0,
      needSewing: true,
      notes: ['Kan samengaan met explosief of shotguntrauma.']
    },
    puncturewound: {
      label: 'Steekwonde',
      bleeding: 0.3,
      pain: 1.0,
      needSewing: true,
      notes: ['Denk aan dieper letsel dan zichtbaar aan de buitenkant.']
    },
    burn: {
      label: 'Brandwonde',
      bleeding: 0,
      pain: 2.0,
      needSewing: false,
      notes: ['Koelen, afdekken en temperatuur opvolgen.']
    }
  },

  bandages: {
    field_dressing: {
      label: 'Field dressing',
      effectivenessModifiers: { abrasion: 0.7, avulsion: 0.8, contusion: 1.0, crush: 0.9, cut: 0.9, laceration: 0.1, velocitywound: 0.5, lowvelocitywound: 0.5, mediumvelocitywound: 0.5, highvelocitywound: 0.5, puncturewound: 0.7, burn: 0.7 }
    },
    elastic_bandage: {
      label: 'Elastic bandage',
      effectivenessModifiers: { abrasion: 0.7, avulsion: 0.6, contusion: 1.0, crush: 0.7, cut: 0.7, laceration: 0.7, velocitywound: 0.6, lowvelocitywound: 0.5, mediumvelocitywound: 0.5, highvelocitywound: 0.5, puncturewound: 0.6, burn: 0.9 }
    },
    quick_clot: {
      label: 'Quick Clot',
      effectivenessModifiers: { abrasion: 0.85, avulsion: 0.8, contusion: 1.0, crush: 0.6, cut: 0.6, laceration: 0.8, velocitywound: 0.8, lowvelocitywound: 0.5, mediumvelocitywound: 0.5, highvelocitywound: 0.5, puncturewound: 0.7, burn: 0.4 }
    },
    packing_bandage: {
      label: 'Packing bandage',
      effectivenessModifiers: { abrasion: 0.7, avulsion: 0.6, contusion: 1.0, crush: 0.7, cut: 0.7, laceration: 0.7, velocitywound: 0.6, lowvelocitywound: 0.5, mediumvelocitywound: 0.5, highvelocitywound: 0.5, puncturewound: 0.7, burn: 0.4 }
    }
  },

  tools: {
    tourniquet: 'Tourniquet',
    sewing_kit: 'Sewing kit',
    morphine: 'Morphine',
    epinephrine: 'Epinephrine',
    blood250ml: 'Blood 250 ml',
    blood500ml: 'Blood 500 ml',
    saline250ml: 'Saline 250 ml',
    saline500ml: 'Saline 500 ml',
    propofol: 'Propofol'
  },

  fractureCare: {
    leftArm: 'Immobiliseer linkerarm met spalk of fixatie en beperk gebruik.',
    rightArm: 'Immobiliseer rechterarm met spalk of fixatie en beperk gebruik.',
    leftLeg: 'Immobiliseer linkerbeen en vermijd belasting / lopen.',
    rightLeg: 'Immobiliseer rechterbeen en vermijd belasting / lopen.',
    head: 'Observeer hoofdtrauma nauw, overweeg neurologische evaluatie.',
    torso: 'Observeer rompletsel op interne schade en pijn bij ademhaling of beweging.'
  },

  painLevels: {
    licht: 1,
    gemiddeld: 2,
    hoog: 3,
    extreem: 4
  },

  bloodLossLevels: {
    licht: 1,
    gemiddeld: 2,
    hoog: 3,
    extreem: 4
  }
};
