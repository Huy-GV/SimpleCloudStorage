import { plainToInstance } from "class-transformer";
import { IsIn, IsNotEmpty, IsNumber, IsOptional, Max, Min, MinLength, validateSync } from "class-validator";

class EnvironmentVariables {
    @MinLength(32)
    JWT_SECRET: string;

    @IsNotEmpty()
    DATA_BUCKET_AWS: string;

    @IsNotEmpty()
    REGION_AWS: string;

    @IsNotEmpty()
    DATABASE_URL: string;

    @IsNumber()
    @Min(0)
    @Max(65535)
    SERVER_PORT: number = 5000

    @IsOptional()
    DOWNLOAD_DIR: string;

    @IsIn(['development', 'production'])
    NODE_ENV: string;

    @IsNotEmpty()
    AWS_PROFILE: string;
}

export function validateEnvConfiguration(config: Record<string, unknown>) {
    const envConfiguration = plainToInstance(
        EnvironmentVariables,
        config,
        {
            enableImplicitConversion: true
        },
    );

    const errors = validateSync(envConfiguration, { skipMissingProperties: false });
    if (errors.length > 0) {
        throw new Error(errors.toString());
    }

    return envConfiguration;
  }
