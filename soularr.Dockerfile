FROM python:3.11-slim@sha256:07d4824036af339fa1b6ef769cc99d9c10a141769538b52b3b597c84f7a7b535

ARG SOULARR_COMMIT=33116daedb54f692e9209cb580b952f07a10cd4c

ADD https://github.com/mrusse/soularr.git#${SOULARR_COMMIT} /src

WORKDIR /app

RUN cp /src/soularr.py /src/LICENSE /app/ \
    && grep -viE '^(flask|waitress)' /src/requirements.txt > /tmp/requirements.txt \
    && pip install --no-cache-dir -r /tmp/requirements.txt \
    && rm -rf /src /tmp/requirements.txt \
    && useradd --uid 1000 --no-create-home --home-dir /nonexistent --shell /usr/sbin/nologin soularr

ENV PYTHONUNBUFFERED=1 \
    IN_DOCKER=Yes

USER soularr

CMD ["python", "-u", "/app/soularr.py"]
