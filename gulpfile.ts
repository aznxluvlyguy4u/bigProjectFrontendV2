const gulp = require('gulp');
const env = require('gulp-env');

const staging_user_frontend_bucket = 'dev-online.nsfo.nl';
const production_user_frontend_bucket = 'online.nsfo.nl';
const reader_user_frontend_bucket = 'reader.nsfo.nl';
const public_read = 'public-read';
const retry_count = 5;
const build_folder = 'dist/nsfo-frontend-new';

/**
 * Load environment variables from JSON File.
 */

env({
    file: 'env.json'
});


/**
 * Initialize AWS Config.
 */

const awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    useIAM: true
};

const s3 = require('gulp-s3-upload')(awsConfig);

/**
 * Task to deploy build files directly to AWS S3 hosted website Bucket.
 */

gulp.task('deploy:staging', function() {
  return gulp.src([build_folder + '/**/*'])
    .pipe(s3({
      Bucket: staging_user_frontend_bucket,
      ACL:    public_read
    }, {
      maxRetries: retry_count
    }))
    ;
});

gulp.task('deploy:prod', function() {
  return gulp.src([build_folder + '/**/*'])
    .pipe(s3({
      Bucket: production_user_frontend_bucket,
      ACL:    public_read
    }, {
      maxRetries: retry_count
    }))
    ;
});

/*
 * Task to deploy reader Gallagher version tot testing
 */

gulp.task('deploy:reader', function() {
  return gulp.src([build_folder + '/**/*'])
    .pipe(s3({
      Bucket: reader_user_frontend_bucket,
      ACL:    public_read
    }, {
      maxRetries: retry_count
    }))
    ;
});

/**
 * Task to deploy maintenance page directly to AWS S3 hosted website Bucket.
 */

gulp.task('deploy:staging:maintenance', function() {
  return gulp.src(['src/maintenance-page/*'])
    .pipe(s3({
      Bucket: staging_user_frontend_bucket,
      ACL:    public_read
    }, {
      maxRetries: retry_count
    }))
    ;
});

gulp.task('deploy:prod:maintenance', function() {
  return gulp.src(['src/maintenance-page/*'])
    .pipe(s3({
      Bucket: production_user_frontend_bucket,
      ACL:    public_read
    }, {
      maxRetries: retry_count
    }))
    ;
});
