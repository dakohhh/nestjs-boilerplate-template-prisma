import { Schema, Repository } from "redis-om";
import { RedisOMService } from "./redisom.service";
import { DynamicModule, Module, Provider } from "@nestjs/common";
import { EntityClass, getRepositoryToken } from "./redisom.decorators";

@Module({
  providers: [RedisOMService],
  exports: [RedisOMService],
})
export class RedisOMModule {
  static forFeature(entities: { entity: EntityClass<any>; schema: Schema<any> }[]): DynamicModule {
    const providers: Provider[] = entities.map(({ entity, schema }) => ({
      provide: getRepositoryToken(entity),
      useFactory: async (redisService: RedisOMService): Promise<Repository<any>> => {
        const client = await redisService.getOrCreateClient();
        const repository = client.fetchRepository(schema);
        await repository.createIndex();
        return repository;
      },
      inject: [RedisOMService],
    }));

    return {
      module: RedisOMModule,
      providers,
      exports: providers,
    };
  }
}
