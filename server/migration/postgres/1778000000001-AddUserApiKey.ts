import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserApiKey1778000000001 implements MigrationInterface {
  name = 'AddUserApiKey1778000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "apiKey" varchar`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_user_apiKey" UNIQUE ("apiKey")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_user_apiKey"`
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "apiKey"`);
  }
}
