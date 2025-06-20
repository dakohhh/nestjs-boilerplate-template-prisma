import { Inject } from "@nestjs/common";

export type EntityClass<T> = new (...args: any[]) => T;

export function getRepositoryToken(entityClass: EntityClass<any>): string {
  return `${entityClass.name}Repository`;
}

export const InjectRepository = <T>(entityClass: EntityClass<T>) => Inject(getRepositoryToken(entityClass));
