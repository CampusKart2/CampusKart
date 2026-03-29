@Library('my-shared-lib') _

pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    TARGET_ENV = ''
    DEPLOY_ALLOWED = 'false'
  }

  stages {
    stage('Init') {
      steps {
        script {
          def branch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: ''

          if (branch == 'qa') {
            env.TARGET_ENV = 'QA'
            env.DEPLOY_ALLOWED = 'true'
          } else if (branch == 'dev') {
            env.TARGET_ENV = 'LIVE'
            env.DEPLOY_ALLOWED = 'true'
          } else {
            env.TARGET_ENV = 'NON_DEPLOY'
            env.DEPLOY_ALLOWED = 'false'
          }

          echo "Branch detected: ${branch}"
          echo "Target environment: ${env.TARGET_ENV}"
          echo "Deploy allowed: ${env.DEPLOY_ALLOWED}"
        }
      }
    }

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Notify Start') {
      steps {
        script {
          notifySlack('STARTED', '#jenkins')
        }
      }
    }

    stage('Branch Validation') {
      steps {
        script {
          def branch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: ''

          if (!(branch in ['qa', 'dev'])) {
            echo "This branch is not configured for deployment."
            echo "Pipeline will run base checks only."
          } else {
            echo "Autonomous branch selection successful for ${branch}."
          }
        }
      }
    }

    stage('Basic Payload Test') {
      steps {
        sh '''
          echo "=== Basic Jenkins Payload ==="
          echo "User:"
          whoami
          echo
          echo "Host:"
          hostname
          echo
          echo "Working Directory:"
          pwd
          echo
          echo "Workspace Contents:"
          ls -la
        '''
      }
    }

    stage('Branch Summary') {
      steps {
        script {
          echo "Branch Name     : ${env.BRANCH_NAME}"
          echo "Target Env      : ${env.TARGET_ENV}"
          echo "Deploy Allowed  : ${env.DEPLOY_ALLOWED}"
          echo "Build Number    : ${env.BUILD_NUMBER}"
          echo "Job Name        : ${env.JOB_NAME}"
        }
      }
    }
  }

  post {
    success {
      script {
        notifySlack('SUCCESS', '#jenkins')
      }
    }
    failure {
      script {
        notifySlack('FAILURE', '#jenkins')
      }
    }
    unstable {
      script {
        notifySlack('UNSTABLE', '#jenkins')
      }
    }
    aborted {
      script {
        notifySlack('ABORTED', '#jenkins')
      }
    }
    always {
      cleanWs()
    }
  }
}