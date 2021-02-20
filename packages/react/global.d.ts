type OneOrMore<T> = readonly [T, ...T[]];
type TwoOrMore<T> = readonly [T, T, ...T[]];

declare module "*.module.css" {
    const classes: {readonly [key: string]: string};
    export default classes;
}
