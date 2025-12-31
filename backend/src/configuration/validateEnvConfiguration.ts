import { plainToInstance } from "class-transformer";
import { IsIn, IsNotEmpty, IsNumber, IsOptional, Max, Min, MinLength, registerDecorator, validateSync, ValidationArguments, ValidationOptions } from "class-validator";
import * as os from 'os';

class EnvironmentVariables {
    @MinLength(32)
    JWT_SECRET: string = "default_jwt_secret_32_chars_minimum_string";

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

    @IsIn(['development', 'production'])
    NODE_ENV: string = "development";

    @IsNotEmptyInDevelopment()
    AWS_PROFILE: string;
}

function IsNotEmptyInDevelopment(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: IsNotEmptyInDevelopment.name,
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const isDevelopment = process.env.NODE_ENV?.trim() === 'development';
                    return !isDevelopment || (value?.trim().length ?? 0 > 0);
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} should not be empty in Development environment`;
                },
            },
        });
    };
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
