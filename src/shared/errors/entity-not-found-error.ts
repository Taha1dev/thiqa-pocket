export class EntityNotFoundError extends Error {
  readonly entity: string
  readonly id: string

  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" was not found.`)
    this.name = "EntityNotFoundError"
    this.entity = entity
    this.id = id
  }
}
