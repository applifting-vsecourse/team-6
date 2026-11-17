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
    /** Category slugs, in category sort order; a tag may belong to several. */
    public readonly categories: string[] = [],
  ) {}
}
