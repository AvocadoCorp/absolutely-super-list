#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

import webapp2

import os
from google.appengine.ext.webapp import template

class MainHandler(webapp2.RequestHandler):
  def get(self):
    if self.request.headers.get('host') == 'absolutelysuperlist.appspot.com':
      self.redirect('http://absolutelysuperlist.avocado.io/', 301)
      return

    path = os.path.join(os.path.dirname(__file__), 'index.html')
    params = {}
    if self.request.get('use_latest', default_value=False):
      params['use_latest'] = True
    self.response.out.write(template.render(path, params))

app = webapp2.WSGIApplication([('/', MainHandler)],
                              debug=False)
