declare module 'ogl' {
  export class Renderer {
    constructor(options?: { dpr?: number; alpha?: boolean; antialias?: boolean });
    gl: any;
    setSize(width: number, height: number): void;
    render(options: { scene: any }): void;
  }
  export class Transform {
    constructor();
  }
  export class Vec3 {
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z: number): Vec3;
    copy(v: Vec3): Vec3;
    add(v: Vec3 | number): Vec3;
    sub(v: Vec3): Vec3;
    multiply(v: Vec3 | number): Vec3;
    lerp(v: Vec3, alpha: number): Vec3;
  }
  export class Color {
    constructor(color: string | number);
  }
  export class Polyline {
    constructor(gl: any, options?: any);
    mesh: any;
    resize(): void;
    updateGeometry(): void;
  }
  export class Program {
    constructor(gl: any, options?: { vertex?: string; fragment?: string; uniforms?: any });
    remove?(): void;
  }
  export class Mesh<T = any> {
    constructor(gl: any, options?: { geometry?: any; program?: any });
    remove?(): void;
  }
  export class Triangle {
    constructor(gl: any);
    remove?(): void;
  }
}
