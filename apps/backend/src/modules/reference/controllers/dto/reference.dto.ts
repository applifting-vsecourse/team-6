export class CategoryDto {
  slug!: string;
}

export class ReferenceDto {
  categories!: CategoryDto[];
}
