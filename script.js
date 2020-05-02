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

        this.node = null;
        this.torsionAngle = 0;  // by default, we assume upright to handle endpoints cornercase
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
     * id:              id of the other atom
     * pos:             position to add to
     * torsionAngle:    torsion angle, 0 to 5 -> [12, 2, 4, 6, 8, 10] O'Clock
     */
    addBond(id, pos, torsionAngle) {
        if (this.bonded[pos] === null) {
            this.bonded[pos] = new Bond(id, 1);
            this.degree += 1;

            if (pos === 0) {
                this.torsionAngle = torsionAngle;
            }
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

function drawBond(x, y, dirn, stroke) {
    const len = 40;
    let theta, dy, dx;  // theta follows standard trigonometry conventions
    let invert = dirn >= 3;
    dirn %= 3;
    switch (dirn) {
        case 0:
            theta = Math.PI/2.0;
            dy = -len;
            dx = 0;
            break;
        case 1:
            theta = Math.PI/6.0;
            dy = -(len * Math.sin(theta));
            dx = (len * Math.cos(theta));
            break;
        case 2:
            theta = Math.PI/6.0;
            dy = (len * Math.sin(theta));
            dx = (len * Math.cos(theta));
            break;
    }
    if (invert) dy *= -1, dx *= -1;
    
    let bond = new SVG.Path()
        .plot(`M ${x} ${y} l ${dx.toFixed(2)} ${dy.toFixed(2)}`)
        .stroke({
            width: 2,
            linecap: 'butt',
            color: stroke,
        });
    return {
        node: bond,
        endpoint: { x: x + dx, y: y + dy }
    }
}

function makeBondGuide(atom) {
    console.log(atom.torsionAngle);
    let bondGuide = canvas.group();
    if (atom.torsionAngle % 2 === 0) { // Mercedes-Benz Orientation
        console.log('benz');

        bondGuide.add(drawBond(atom.node.cx(), atom.node.cy(), 0, 'grey').node)
            .add(drawBond(atom.node.cx(), atom.node.cy(), 2, 'grey').node)
            .add(drawBond(atom.node.cx(), atom.node.cy(), 4, 'grey').node);
    } else { // Inverted
        console.log('inverted');

        bondGuide.add(drawBond(atom.node.cx(), atom.node.cy(), 1, 'grey').node)
            .add(drawBond(atom.node.cx(), atom.node.cy(), 3, 'grey').node)
            .add(drawBond(atom.node.cx(), atom.node.cy(), 5, 'grey').node);
    }
    bondGuide.back();   // below everything
    return bondGuide;
}

function makeAtom(text, pos) {
    console.log('making atom ' + text + ' at ' + JSON.stringify(pos));
    const R = 20;

    let atom = canvas.group();
    let dot = atom.circle().radius(R).center(pos.x, pos.y)
        .attr({ stroke: 'none', fill: '#dd7', opacity: .0 });
    let lbl = atom.text(text).center(pos.x, pos.y)
        .attr({ font: '14px "Helvetica Neue", Arial', stroke: '#000' });

    let atomD = molecule.addAtom(text);
    atomD.node = atom;
    //atom.attr({ 'data-atom-id': atomId });

    atom.on('mouseenter', event => {
        dot.attr({ opacity: .4 });
        atomD.bondGuide = makeBondGuide(atomD);
    });
    atom.on('mouseleave', event => {
        dot.attr({ opacity: .0 });
        atomD.bondGuide.remove();
    });

    atom.click(event => {
        if (event.shiftKey) {
            if (toolbar.active === null || toolbar.active.dataset.type !== 'atom') alert('no change'); // TODO: add a visual bell
            lbl.text(toolbar.active.dataset.value);
            if (lbl.attr('text') !== 'C') lbl.show();   // always show non-carbon atoms
        } else {
            if (!atomD.hasBond(1)) {
                makeBond(atomD, pos, (event.ctrlKey ? 1 : 2));
            } else {
                console.error('Bond already exists');
            }

            if (lbl.text() === 'C') {
                let deg = molecule.getAtom(atomD.id).degree;
                if (deg >= 2) lbl.hide();   // hide only if it is an internal atom
            }
        }
    });

    return atomD;
}

/**
 * dirn:    integer from 0 to 2.
 *          | -> 0
 *          / -> 1
 *          \ -> 2
 */
function makeBond(atom1, pos, dirn) {
    let bond = drawBond(pos.x, pos.y, dirn, 'black');
    canvas.add(bond.node);

    let atom2 = makeAtom('C', bond.endpoint);
    //molecule.addBond(atom.id, atom2.id, 1, 0);    // we're not using molecule for now...any ideas?
    if (!atom1.hasBond(0)) {
        atom1.addBond(atom2, 0, dirn);
    } else {
        atom1.addBond(atom2, 1, dirn);
    }
    atom2.addBond(atom1, 0, dirn+3);    // TODO: make this some constant instead of a magic number for now
}

function initCanvas() {
    canvas = SVG().addTo('#canvas').size('100%', '100%');

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
