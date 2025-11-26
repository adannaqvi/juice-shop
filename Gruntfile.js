'use strict'

module.exports = function (grunt) {
  const path = require('node:path')

  function sanitize(input) {
    if (!input) return ''
    return /^[a-zA-Z0-9_-]+$/.test(input) ? input : ''
  }

  const os = sanitize(grunt.option('os') || process.env.PCKG_OS_NAME || '')
  const platform = sanitize(grunt.option('platform') || process.env.PCKG_CPU_ARCH || '')
  const node = sanitize(process.env.nodejs_version || process.env.PCKG_NODE_VERSION || grunt.option('node') || '')

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    replace_json: {
      manifest: {
        src: 'package.json',
        changes: {
          'engines.node': (node || '<%= pkg.engines.node %>'),
          os: (os ? [os] : '<%= pkg.os %>'),
          cpu: (platform ? [platform] : '<%= pkg.cpu %>')
        }
      }
    },

    compress: {
      pckg: {
        options: {
          mode: os === 'linux' ? 'tgz' : 'zip',
          archive: (function () {
            const name = grunt.template.process('<%= pkg.name %>')
            const version = grunt.template.process('<%= pkg.version %>')
            const fileName =
              name + '-' + version +
              (node ? ('_node' + node) : '') +
              (os ? ('_' + os) : '') +
              (platform ? ('_' + platform) : '') +
              (os === 'linux' ? '.tgz' : '.zip')
            return path.join('dist', fileName)
          })()
        },

        files: [
          {
            src: [
              '.well-known/**',
              'LICENSE',
              '*.md',
              'package.json',
              'ctf.key',
              'swagger.yml',
              'server.ts',
              'config.schema.yml',
              'build/**',
              '!build/reports/**',
              'bom.json',
              'bom.xml',
              'config/*.yml',
              'data/*.ts',
              'data/static/**',
              'data/chatbot/.gitkeep',
              'encryptionkeys/**',
              'frontend/dist/frontend/**',
              'frontend/dist/bom/**',
              'frontend/src/**/*.ts',
              'ftp/**',
              'i18n/.gitkeep',
              'lib/**',
              'models/*.ts',
              'node_modules/**',
              'routes/*.ts',
              'uploads/complaints/.gitkeep',
              'views/**'
            ],
            dest: (function () {
              const version = grunt.template.process('<%= pkg.version %>')
              return `juice-shop_${version}/`
            })()
          }
        ]
      }
    }
  })

  grunt.registerTask('checksum', 'Create .md5 checksum files', function () {
    const fs = require('node:fs')
    const crypto = require('node:crypto')

    fs.readdirSync('dist/').forEach(file => {
      if (file.includes('..')) return

      const filePath = path.join('dist', file)
      const buffer = fs.readFileSync(filePath)

      const md5 = crypto.createHash('md5')
      md5.update(buffer)
      const md5Hash = md5.digest('hex')

      const md5FileName = filePath + '.md5'
      grunt.file.write(md5FileName, md5Hash)

      grunt.log.write(`Checksum ${md5Hash} written to file ${md5FileName}.`).ok()
      grunt.log.writeln()
    })
  })

  grunt.loadNpmTasks('grunt-replace-json')
  grunt.loadNpmTasks('grunt-contrib-compress')
  grunt.registerTask('package', ['replace_json:manifest', 'compress:pckg', 'checksum'])
}
