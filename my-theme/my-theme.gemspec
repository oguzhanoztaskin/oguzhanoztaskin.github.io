# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name          = "my-theme"
  spec.version       = "0.1.0"
  spec.authors       = ["Oguzhan Oztaskin"]
  spec.email         = ["oguzhannoztaskin@gmail.com"]

  spec.summary       = "A custom Jekyll theme"
  spec.description   = "A custom Jekyll theme for my blog"
  spec.homepage      = "https://github.com/oguzhanoztaskin/my-theme"
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0").select { |f| f.match(%r!^(assets|_layouts|_includes|_sass|LICENSE|README|_config\.yml)!i) }

  spec.add_runtime_dependency "jekyll", "~> 4.0"
  spec.add_runtime_dependency "jekyll-feed", "~> 0.9"
  spec.add_runtime_dependency "jekyll-seo-tag", "~> 2.1"
  spec.add_runtime_dependency "jekyll-sitemap", "~> 1.0"

  spec.add_development_dependency "bundler", "~> 2.0"
end
