export interface IService<T, CreateDTO, UpdateDTO = Partial<CreateDTO>> {
  getAll(params?: Record<string, unknown>): Promise<T[]>
  getById(id: number): Promise<T>
  create(data: CreateDTO): Promise<T>
  update(id: number, data: UpdateDTO): Promise<T>
  delete(id: number): Promise<void>
}
