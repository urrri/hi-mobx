/**
 * returns "is version current" status
 */
export type IsCurrent = () => boolean;

/**
 * pins current version and returns "is version current" status checker
 */
export type PinVersion = () => IsCurrent;

export class DataVersion {
  #ver = 1;

  /**
   * promotes version
   */
  next: VoidFunction = () => {
    this.#ver += 1;
  };

  /**
   * pins current version and returns "is version current" status checker
   */
  pin: PinVersion = () => {
    const current = this.#ver;
    return () => current === this.#ver;
  };
}
