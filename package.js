Package.describe({
	"name": "arsnebula:supertags",
	"summary": "Tagging system for objects and MongoDB documents",
	"version": "0.1.0",
	"git": "git@bitbucket.org:arsnebula/meteor-billing.git"
});

Package.onUse(function(api) { 
	api.versionsFrom("1.0");
	api.use("mizzao:autocomplete@0.4.10");
  api.use("arsnebula:reactive-varx@0.9.2");

	api.use("arsnebula:classx@2.0.5");
  api.use("templating");

	api.addFiles([
		"lib/js/supertags.namespace.js",
    "lib/js/supertags.controller.js",
    "lib/js/supertags.mongocontroller.js",
    "lib/js/supertags.helpers.js",
		"lib/js/supertags.activate.js",
	]);

  api.addFiles([
    "lib/classes/collection.supertags.js"
  ]);

	api.addFiles([  
		"lib/collections/mentions.collections.js",
		"lib/collections/hashtags.collections.js"
	]);

  api.addFiles([
    "lib/templates/supertags.textfields.html",
    "lib/templates/supertags.textfields.js"
  ], ["client"])

	api.export("SuperTags");
})