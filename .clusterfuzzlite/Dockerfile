FROM gcr.io/oss-fuzz-base/base-builder-javascript

RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  ca-certificates \
  gnupg \
  git \
  && curl -fsSL https://deb.nodesource.com/setup_26.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

COPY . $SRC/envguardr
WORKDIR $SRC/envguardr

COPY .clusterfuzzlite/build.sh $SRC/build.sh
