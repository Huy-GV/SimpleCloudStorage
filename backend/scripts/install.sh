#!/bin/bash
# installs nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

nvm install 21.6.1

cd /home/ec2-user/app
npm install --production
npm install -g dotenv-cli
