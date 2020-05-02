/* General Helper Functions */
function docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

/* Data Representation */
class Bond {
    constructor(to, type) {
        this.to = to;
        this.type = type;   // 1, 2, 3 for single, double and triple
    }
}

let valence = {  // Temporary abstraction
    'C': 4
};
class Atom {
    /**
     * Convention for tetrahedral atoms: neighbors are numbered using R relative to 0
     */

    constructor(id, label) {
        this.id = id;
        this.label = label;

        this.degree = 0;
        this.bonded = new Array(valence[label]).fill(null);   // IDs of atoms it is bonded to
    }

    getDegree() {
        return this.degree;
    }

    /**
     * pos:     position to check
     */
    hasBond(pos) {
        return this.bonded[pos] !== null;
    }

    /**
     * id:      id of the other atom
     * pos:     position to add to
     */
    addBond(id, pos) {
        if (this.bonded[pos] === null) {
            this.bonded[pos] = new Bond(id, 1);
            this.degree += 1;
        } else {
            console.error('Already occupied!');   // TODO: more robust error handling
        }
    }
};

class Molecule {
    // TODO: Add a constructor for InChI string
    constructor() {
        this.atomCount = 0;
        this.atoms = [];
    }

    addAtom(label) {
        let newAtom = new Atom(this.atomCount++, label);
        this.atoms.push(newAtom);
        return newAtom;
    }

    addBond(atomId1, atomId2, pos1, pos2) {
        this.atoms[atomId1].addBond(atomId2, pos1);
        this.atoms[atomId2].addBond(atomId1, pos2);
    }

    getAtom(id) {
        return this.atoms[id];
    }
};

let molecule = new Molecule();  // TODO: for now, we assume only 1 molecule

/* Drawing Tool */

let canvas = null;
let toolbar = null;

const svgNS = 'http://www.w3.org/2000/svg';

function makeAtom(text, pos) {
    console.log('making atom ' + text + ' at ' + JSON.stringify(pos));
    const R = 20;

    let atom = canvas.group();
    let dot = atom.circle().radius(R).center(pos.x, pos.y)
        .attr({ stroke: 'none', fill: '#dd7', opacity: .0 });
    let lbl = atom.text(text).center(pos.x, pos.y)
        .attr({ font: '14px "Helvetica Neue", Arial', stroke: '#000' });

    let atomD = molecule.addAtom(text, atom);
    //atom.attr({ 'data-atom-id': atomId });

    atom.on('mouseenter', event => {
        dot.attr({ opacity: .4 });
    });
    atom.on('mouseleave', event => {
        dot.attr({ opacity: .0 });
    });

    atom.click(event => {
        if (event.shiftKey) {
            if (toolbar.active === null || toolbar.active.dataset.type !== 'atom') alert('no change'); // TODO: add a visual bell
            lbl.text(toolbar.active.dataset.value);
            if (lbl.attr('text') !== 'C') lbl.show();   // always show non-carbon atoms
        } else {
            console.log(atomD);
            if (!atomD.hasBond(1)) {
                makeBond(atomD, pos, (event.ctrlKey ? 0 : 2));
            } else {
                console.error('Bond already exists');
            }

            if (lbl.text() === 'C') {
                let deg = molecule.getAtom(atomD.id).degree;
                console.log(deg);
                if (deg >= 2) lbl.hide();   // hide only if it is an internal atom
            }
        }
    });

    return atomD;
}

/**
 * dirn:    integer from 0 to 2.
 *          / -> 0
 *          | -> 1
 *          \ -> 2
 *
 */
function makeBond(atom, pos, dirn) {
    const len = 40;
    let theta, dy, dx;  // theta follows standard trigonometry conventions
    switch (dirn) {
        case 0:
            theta = Math.PI/6.0;
            dy = -(len * Math.sin(theta)).toFixed(2);
            dx = (len * Math.cos(theta)).toFixed(2);
            break;
        case 1:
            theta = Math.PI/2.0;
            dy = -len;
            dx = 0;
            break;
        case 2:
            theta = Math.PI/6.0;
            dy = (len * Math.sin(theta)).toFixed(2);
            dx = (len * Math.cos(theta)).toFixed(2);
            break;
    }
    
    let bond = canvas.path(
        `M ${pos.x} ${pos.y} l ${dx} ${dy}`
    ).attr({
        'stroke-width': 2,
        'stroke-linecap': 'butt',
        'stroke': 'black',
        'x': pos.x,
        'y': pos.y,
    });

    let atom2 = makeAtom('C', { x: pos.x + parseFloat(dx), y: pos.y + parseFloat(dy) });
    molecule.addBond(atom.id, atom2.id, 1, 0);
}

function initCanvas() {
    canvas = SVG().addTo('#canvas').size('100%', '100%');
    console.log(canvas);

    canvas.click(event => {
        if (toolbar.active === null) return;
        console.log(event);

        if (event.target === canvas.node) {
            let pos = { x: event.offsetX, y: event.offsetY };
            makeAtom(toolbar.active.dataset.value, pos);
        } // leave the rest to child handlers
    });
}

function initToolbar() {
    toolbar = {
        el: document.querySelector('.toolbar'),
        active: null,
    };

    toolbar.el.addEventListener('click', event => {
        if (!event.target.classList.contains('button'))
            return;

        if (toolbar.active !== null)
            toolbar.active.classList.remove('selected');
        toolbar.active = event.target;
        toolbar.active.classList.add('selected');
    }, false);
}

docReady(function() {
    console.clear();    // DEBUG
    initCanvas();
    initToolbar();
});
