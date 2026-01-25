import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode,
  Options,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { TestsService } from './tests.service';
import { GetTestDto, TestResponseDto, CreateTestDto } from './dto/test.dto';

@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  // ✅ Добавляем обработку preflight-запросов
  @Options('*path')
  handleOptions(@Res() res: Response) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:9000');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Accept',
    );
    res.sendStatus(200);
  }

  // ✅ Далее твои обычные методы
  @Get()
  async getAllTests(): Promise<TestResponseDto[]> {
    return this.testsService.getAllTests();
  }

  @Get('test')
  async getTestByCodeAndVariant(
    @Query(ValidationPipe) getTestDto: GetTestDto,
  ): Promise<TestResponseDto> {
    return this.testsService.getTestByCodeAndVariant(
      getTestDto.testCode,
      getTestDto.variant,
    );
  }

  @Get('test-with-images')
  async getTestWithImages(
    @Query(ValidationPipe) getTestDto: GetTestDto,
  ): Promise<TestResponseDto & { images: Record<number, string> }> {
    return this.testsService.getTestWithImages(
      getTestDto.testCode,
      getTestDto.variant,
    );
  }

  @Get('code/:testCode')
  async getTestsByCode(
    @Param('testCode') testCode: string,
  ): Promise<TestResponseDto[]> {
    return this.testsService.getTestsByCode(testCode);
  }

  @Get(':id')
  async getTestById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TestResponseDto> {
    return this.testsService.getTestById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTest(
    @Body(ValidationPipe) createTestDto: CreateTestDto,
  ): Promise<TestResponseDto> {
    return this.testsService.createTest(createTestDto);
  }

  @Put(':id')
  async updateTest(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateData: Partial<CreateTestDto>,
  ): Promise<TestResponseDto> {
    return this.testsService.updateTest(id, updateData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTest(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.testsService.deleteTest(id);
  }
}
