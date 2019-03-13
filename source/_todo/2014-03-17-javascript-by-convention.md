---
layout: post
title: Javascript by convention
date: 2014-03-17 11:29
comments: true
sharing: true
footer: true
categories:
- opinion
- javascript
- code quality
---
Usually when doing javascript, you'll see a lot of script inside a page. For instance when we add a datapicker on a text input, you could add a script block to the page and do the necessary initialization there:

{% highlight html %}
<h1>Modify your settings</h1>

@using (Html.BeginForm())
{
    <div class="control-group">
        <label class="control-label">Birthdate</label>
        <div class="controls">
            <div class="input-append">
                <input type="text" name="birthDate" id="birthDate" />
                <span class="add-on">
                    <i class="icon-calendar"></i>
                </span>
            </div>
        </div>
    </div>
}

<script type="text/javascript">

    $(document).ready(function() {

        $('#birthDate').datepicker({
            dateFormat: 'dd-mm-yy'
        });

    });

</script>
{% endhighlight %}

Now what if we needed to do this more then just once? Let’s change our html to a more unobtrusive way:

{% highlight html %}
<input type="text" name="birthDate" id="birthDate" data-role="datepicker" />
{% endhighlight %}

Now just add a new javascript file to your website and include it in our html.

{% highlight javascript %}
(function ($) {

  $(document).ready(function () {
  	//datepicker convention
	$(':text[data-role="datepicker"]').datepicker({
          dateFormat: 'dd-mm-yy'
        });
  });

})(jQuery);
{% endhighlight %}

In this file we make sure we alias ‘$’ to jQuery as another plugin we use could have aliased it differently.

> If you are worried about performance of the selector used here, you can always use a class in your convention