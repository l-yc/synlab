function docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

let canvas = null;
let toolbar = null;

const svgNS = 'http://www.w3.org/2000/svg';

function renderedTextSize(string, font, fontSize) {
    var paper = Raphael(0, 0, 0, 0)
    paper.canvas.style.visibility = 'hidden'
    var el = paper.text(0, 0, string)
    el.attr('font-family', font)
    el.attr('font-size', fontSize)
    var bBox = el.getBBox()
    paper.remove()
    return {
        width: bBox.width,
        height: bBox.height
    }
}

function trash() {
    var color = "hsb(" + [(1 - R / max) * .5, 1, .75] + ")",
        dt = r.circle(dx + 60 + R, dy + 10, R).attr({stroke: "none", fill: color});
    if (R < 6) {
        var bg = r.circle(dx + 60 + R, dy + 10, 6).attr({stroke: "none", fill: "#000", opacity: .4}).hide();
    }
    var lbl = r.text(dx + 60 + R, dy + 10, data[o])
        .attr({"font": '10px "Helvetica Neue", Arial', stroke: "none", fill: "#fff"}).hide();
    var dot = r.circle(dx + 60 + R, dy + 10, max).attr({stroke: "none", fill: "#000", opacity: 0});
    dot.hover(function () {
        if (bg) {
            bg.show();
        } else {
            var clr = Raphael.rgb2hsb(color);
            clr.b = .5;
            dt.attr("fill", Raphael.hsb2rgb(clr).hex);
        }
        lbl.show();
    }, function () {
        if (bg) {
            bg.hide();
        } else {
            dt.attr("fill", color);
        }
        lbl.hide();
    });
}

console.clear();

function makeAtom(text, pos) {
    console.log('making atom ' + text + ' at ' + JSON.stringify(pos));
    const R = 20;

    let dot = paper.circle(pos.x, pos.y, R)
        .attr({ stroke: 'none', fill: '#dd7', opacity: .4 });
    let lbl = paper.text(pos.x, pos.y , text)
        .attr({'font': '14px "Helvetica Neue", Arial', stroke: '#000', fill: 'none'});
    var atom = paper.set(dot, lbl);

    atom.hover(event => {
        dot.attr({ fill: '#dd7' });
    }, event => {
        dot.attr({ fill: '#fff' });
    });

    atom.click(event => {
        makeBond(pos, event.ctrlKey ? 1 : 3);
    });
}

function makeBond(pos, dirn) {
    const len = 40;
    let theta, dy, dx;
    if (dirn == 1) {
        theta = Math.PI/6.0;
        dy = -(len * Math.sin(theta)).toFixed(2);
        dx = (len * Math.cos(theta)).toFixed(2);
    } else if (dirn == 3) {
        theta = Math.PI/6.0;
        dy = (len * Math.sin(theta)).toFixed(2);
        dx = (len * Math.cos(theta)).toFixed(2);
    }
    
    let bond = paper.path(
        `M ${pos.x} ${pos.y} l ${dx} ${dy}`
    ).attr({
        'stroke-width': 2,
        'stroke-linecap': 'butt',
        'stroke': 'black',
        'x': pos.x,
        'y': pos.y,
    });

    makeAtom('C', { x: pos.x + parseFloat(dx), y: pos.y + parseFloat(dy) });
}

function initCanvas() {
    canvas = document.querySelector('#canvas');
    paper = Raphael(canvas, 0, 0);

    canvas.addEventListener('click', event => {
        if (toolbar.active === null) return;
        console.log(event);

        if (event.target === canvas.querySelector('svg')) {
            let pos = { x: event.offsetX, y: event.offsetY };
            //let atom = makeAtom(toolbar.active.dataset.value, pos);
            //canvas.appendChild(atom);
            makeAtom(toolbar.active.dataset.value, pos);
        } else {
            //var rect = event.target.getBoundingClientRect();
            //console.log(rect);
            //let pos = { x: rect.x, y: rect.y };
            //let bond = makeBond(pos);
            //canvas.appendChild(bond);
        }

    }, false);
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
    initCanvas();
    initToolbar();
});
