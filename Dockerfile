FROM ruby:3.1.1-alpine3.15

RUN apk add --no-cache build-base nodejs-current

RUN gem install bundler

WORKDIR /usr/src/app

COPY . /usr/src/app

RUN bundle install

CMD ["bundle", "exec", "jekyll", "serve", "--force_polling", "--livereload", "--livereload_port", "35730", "--host", "0.0.0.0"]

EXPOSE 4000
EXPOSE 35730

