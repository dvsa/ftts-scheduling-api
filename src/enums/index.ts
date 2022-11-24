export const existsInEnum = <T>(enumType: T, value: string): boolean => Object.values(enumType).includes(value);

export enum TCNRegion {
  A = 'a',
  B = 'b',
  C = 'c',
}

export enum BookingStatus {
  CONFIRMED = 675030001,
  CANCELLED = 675030008,
}
