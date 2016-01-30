# Setup

1. Ensure everything is up to date by running `sudo npm update` after `cd`ing into the directory this file lives in
2. Configure your `gulpfile.js` as needed (and see what tasks are available)
3. Run `gulp` to dev: (pre-)compiling, file watching, browser-relaoding, etc.
  1. Run `sudo ulimit -n 8192` if you get a 'memory limit exceeded' error
  2. Run `gulp -s` (or `gulp --silent`) to prevent launching a new live-reloading browser window
  3. Run `gulp -g` (or `gulp --ghost`) to sync all browser page changes, scrolling, and clicks between clients



# Structure

* `src/assets/scripts/` should contain your source code, whereas `build/assets/js/` should contain only dynamically generated javascript
* `src/assets/styles/`, likewise, should contain your source code, whereas `build/assets/css/` should contain only dynamically generated css
* `src/assets/images/` is for all site-specific static images; any user-uploaded content should be kept elsewhere
* `src/assets/icons/` is for all SVG icons; they will be minified/optimized into `build/assets/icon/`
* `src/views/` is for partials to be rendered as full view templates (e.g. public vs. authenticated, header1 vs. header2)
* `src/views/page/` is for partials that will be included in other views (e.g. subviews)
* `src/templates/` is for general-purpose partials (i.e. angular directive templates, re-used UI elements, or repeated content sections)
