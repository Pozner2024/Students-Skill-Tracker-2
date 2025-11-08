import { Module } from '@nestjs/common';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';
import { TestResultsController } from './test-results.controller';
import { TestResultsService } from './test-results.service';
import { ImagesModule } from '../images/images.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ImagesModule, AuthModule],
  controllers: [TestsController, TestResultsController],
  providers: [TestsService, TestResultsService],
  exports: [TestsService, TestResultsService],
})
export class TestsModule {}
