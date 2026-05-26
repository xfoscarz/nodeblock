export class Entity {
    private static _id: number = 0;
    public readonly id: number = Entity._id++;
    
    constructor() {}
}