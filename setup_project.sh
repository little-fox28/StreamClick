#!/usr/bin/env bash
# ==============================================================================
# Setup Script for StreamClick: E-commerce Clickstream Tracking (Lambda Architecture)
# ==============================================================================

set -e

echo "🚀 Initializing StreamClick Project Structure..."

# Create directory hierarchy
mkdir -p \
  core/schemas \
  core/adapters/broker \
  core/adapters/storage \
  api/routers \
  streaming/sinks \
  batch/queries \
  infrastructure/docker/postgres \
  infrastructure/docker/minio \
  infrastructure/scripts

# Create __init__.py in all Python packages
touch \
  core/__init__.py \
  core/schemas/__init__.py \
  core/adapters/__init__.py \
  core/adapters/broker/__init__.py \
  core/adapters/storage/__init__.py \
  api/__init__.py \
  api/routers/__init__.py \
  streaming/__init__.py \
  streaming/sinks/__init__.py \
  batch/__init__.py

echo "✅ Directories and __init__.py files created."
