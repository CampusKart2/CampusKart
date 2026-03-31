@Library('my-shared-lib') _

pipeline {
  agent { label 'dev-agent' }

  options {
    skipDefaultCheckout(true)
  }

  triggers {
    githubPush()
  }

  environment {
    APP_NAME = 'campuskart-app'
    CONTAINER_NAME = 'campuskart-container'
    PORT = '3000'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Notify Start') {
      agent any
      steps {
        script {
          notifySlack('STARTED', '#jenkins')
        }
      }
    }

    stage('Build Frontend') {
      steps {
        dir('Frontend') {
          sh '''
            npm ci
            npm run build
          '''
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        sh '''
          docker build -t $APP_NAME .
        '''
      }
    }

    stage('Stop Old Container') {
      steps {
        sh '''
          docker stop $CONTAINER_NAME || true
          docker rm $CONTAINER_NAME || true
        '''
      }
    }

    stage('Run New Container') {
      steps {
        sh '''
          docker run -d \
            --restart unless-stopped \
            --name $CONTAINER_NAME \
            -p $PORT:$PORT \
            $APP_NAME
        '''
      }
    }

    stage('Smoke (testRigor)') {
      steps {
        withCredentials([string(credentialsId: 'TESTRIGOR_TOKEN', variable: 'TR_TOKEN')]) {
          sh '''
            curl -X POST \
              -H 'Content-type: application/json' \
              -H "auth-token: $TR_TOKEN" \
              --data '{ "storedValues": { "storedValueName1": "Value" }, "customName": "optionalNameForRun" }' \
              https://api.testrigor.com/api/v1/apps/zikCmbLzeWkEez2bz/retest
          '''
        }
      }
    }

  }

  post {
    always {
      node('qa') {
        script {
          notifySlack(currentBuild.currentResult, '#jenkins')
        }
      }
    }
  }
}