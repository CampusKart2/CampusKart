@Library('my-shared-lib') _

pipeline {
  agent { label 'dev-agent' }

  options {
    skipDefaultCheckout(true)
  }
  triggers {
    githubPush()
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
//test comment
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

    stage('Deploy to ~/CampusKart') {
      steps {
        sh '''
          mkdir -p ~/CampusKart
    rsync -av --delete \
      --exclude='.env' \
      --exclude='.env.local' \
      --exclude='.env.production' \
      ./ ~/CampusKart/
        '''
      }
    }
	
	stage('Smoke (testRigor)') {
  steps {
    withCredentials([string(credentialsId: 'TESTRIGOR_TOKEN', variable: 'TR_TOKEN')]) {
      sh '''
        curl -X POST \
  -H 'Content-type: application/json' \
  -H 'auth-token: TESTRIGOR_TOKEN' \
  --data '{ "storedValues": { "storedValueName1": "Value" }, "customName": "optionalNameForRun" }' \
  https://api.testrigor.com/api/v1/apps/zikCmbLzeWkEez2bz/retest
      '''
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
}
