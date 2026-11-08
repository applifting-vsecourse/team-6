export class CityEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly lat: number,
    public readonly lng: number,
  ) {}
}

export class TagEntity {
  constructor(
    public readonly id: string,
    public readonly slug: string,
  ) {}
}
