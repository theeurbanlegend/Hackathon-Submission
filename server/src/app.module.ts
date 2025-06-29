import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RepositoryModule } from './repository/repository.module';
import { BillModule } from './modules/bill/bill.module';
import { CardanoModule } from './modules/cardano/cardano.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/hackathon',
      }),
    }),
    ScheduleModule.forRoot(),
    RepositoryModule,
    BillModule,
    CardanoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
