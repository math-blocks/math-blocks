import { Point, distance, clamp, len } from './handwriting-utils';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        canvas {
            width: 1024px;
            height: 768px;
        }
    </style>
    <canvas width="2048" height="1536"></canvas>`;

// TODO: refactor to use observables and then write a test for the behavior
// of the observable.

class HandwritingElement extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    const canvas = shadowRoot.querySelector('canvas');
    if (canvas) {
      const context = canvas.getContext('2d');
      const RADIUS = 1.25;

      if (context) {
        let down = false;
        context.scale(2, 2);

        context.strokeStyle = 'rgba(0,0,0,0.5)';
        context.lineWidth = 0.5;
        context.beginPath();
        let y = 0;
        while (y < 768) {
          y += 36;
          context.moveTo(0, y);
          context.lineTo(1024, y);
        }
        context.stroke();

        context.strokeStyle = 'blue';
        context.lineWidth = 2 * RADIUS;
        context.fillStyle = 'blue';
        context.lineJoin = 'round';
        context.lineCap = 'round';

        let prevPoint: Point | null = null;
        let prevRawPoints: Point[] = [];
        let prevCooked: Point | null = null;

        canvas.addEventListener('pointerdown', (e) => {
          if (e.pointerType === 'touch') {
            return;
          }
          down = true;
        });

        canvas.addEventListener('pointermove', (e) => {
          if (e.pointerType === 'touch' || !down) {
            return;
          }
          const point = { x: e.offsetX, y: e.offsetY };

          if (!prevPoint) {
            context.fillStyle = 'blue';
            context.beginPath();
            context.ellipse(
              e.offsetX,
              e.offsetY,
              RADIUS,
              RADIUS,
              0,
              0,
              2 * Math.PI,
            );
            context.fill();
            prevCooked = point;
          } else if (prevRawPoints.length > 2 && prevCooked) {
            if (distance(point, prevPoint) < 3.0) {
              return;
            }

            const [a, b] = prevRawPoints.slice(-2);
            const c = point;

            const p = { x: b.x - a.x, y: b.y - a.y };
            const q = { x: c.x - b.x, y: c.y - b.y };
            const inner = clamp(
              (p.x * q.x + p.y * q.y) / (len(p) * len(q)),
              -1.0,
              1.0,
            );
            const rad = Math.acos(inner);
            const deg = (180 * rad) / Math.PI;

            let newPoint;

            if (Math.abs(deg) > 70) {
              // don't average the point if it's a sharp corner
              newPoint = b;
            } else {
              const x = (a.x + b.x + c.x) / 3.0;
              const y = (a.y + b.y + c.y) / 3.0;
              newPoint = { x, y };
            }

            context.beginPath();
            context.moveTo(prevCooked.x, prevCooked.y);
            context.lineTo(newPoint.x, newPoint.y);
            context.stroke();
            prevCooked = newPoint;
          }

          prevPoint = point;
          prevRawPoints.push(prevPoint);
        });
        canvas.addEventListener('pointerup', (e) => {
          if (e.pointerType === 'touch') {
            return;
          }
          down = false;

          // TODO: Do the same thing we do in pointermove and then
          // draw this last segment.

          if (prevCooked) {
            const newPoint = { x: e.offsetX, y: e.offsetY };
            context.beginPath();
            context.moveTo(prevCooked.x, prevCooked.y);
            context.lineTo(newPoint.x, newPoint.y);
            context.stroke();
          }

          prevRawPoints = [];
          prevPoint = null;
          prevCooked = null;
        });
      }
    }
  }
}

customElements.define('x-handwriting', HandwritingElement);
