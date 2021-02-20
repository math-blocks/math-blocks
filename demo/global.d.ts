type OneOrMore<T> = [T, ...T[]];
type TwoOrMore<T> = [T, T, ...T[]];

declare module "*.module.css" {
    const classes: {readonly [key: string]: string};
    export default classes;
}
