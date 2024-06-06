#!/bin/bash
cd /home/ec2-user/app/dist
npx dotenv -e .env.prod.aws -- nest start
