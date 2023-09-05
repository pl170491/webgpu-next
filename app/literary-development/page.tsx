export default function Index() {
  return (
    <>
      <h1>Literary Development</h1>
      <h2>Introduction</h2>
      <p>What, you may ask, is literary development?</p>
      <p>
        I like to think of it in terms of a dream - an idyllic landscape, if you
        will. Imagine, dear reader, that learning something technical could
        actually be an enjoyable experience. Not only because a library&apos;s
        documentation is well structured and organized, but because it also
        imparts its information to you in a lively and engaging way. That it no
        longer treats you as an afterthought, but rather considers you an
        integral part of the experience - not only of the documentation of said
        library, but also its development lifecycle. That we can experience the
        ups and downs, the dramatic moments, the insecurities and doubts of a
        technical creation; nay, the journey of the creation itself, as we come
        to know the tool which we wish to wield in a more personal manner, as
        opposed to the sterility that the commonplace library aspires to
        nowadays.
      </p>
      <p>Oh, I can already hear the incredulous reader exclaim to me,</p>
      <blockquote>
        But Alareti! <em>Why</em> would any programmer even want to know about
        the drama involved in creating some piece of code? Isn&apos;t the whole
        point of a library that we can simply import it, use it, and ignore its
        implementation? More so its history? Isn&apos;t sterility the whole
        point of programming? To distill the mushy vague ideas we humans are
        wont to produce into a cohesive set of instructions so precise that even
        a computer could understand it?
      </blockquote>
      <p>
        And, dear reader, I must confess that in the main you are correct. That
        in the consumption of a library, encapsulation is for the better. That
        the less a program needs to know about the internals of a library, the
        better. After all,{' '}
        <abbr title='Application Programming Interface'>API</abbr>s are valuable
        for a reason - precisely for the fact that they separate the
        implementation from the consumer.
      </p>
      <p>
        But, for there always is a but, are we programmers mere consumers of
        libraries? And is programming not more than simply writing instructions
        for a computer to operate upon? As Harold Abelson once stated in{' '}
        <cite>Structure and Interpretation of Computer Programs</cite>,{' '}
        <q cite='https://www.goodreads.com/quotes/9168-programs-must-be-written-for-people-to-read-and-only'>
          Programs must be written for people to read, and only incidentally for
          machines to execute.
        </q>{' '}
        I shall argue that we programmers ought, and indeed perhaps even{' '}
        <em>need</em>, to understand the libraries which we find occassion to
        use. That it is often only the <em>program</em> one is writing which
        ought to be encapsulated from an understanding of the libraries it
        consumes, as opposed to the <em>programmer</em> himself. That it is in
        fact impossible to write a program which consumes a library, without
        having come to understand the library in question.
      </p>
      <p>And now, my attentive reader, I fear you are apt to respond,</p>
      <blockquote>
        Indeed, Alareti, no one is arguing against the need for proper
        documentation of a library. Such documentation is critical in allowing a
        library to be properly consumed by its users. But any developer will
        tell you that the minimum viable information necessary to accomplish his
        specified goal is what is required of documentation. Anything less is
        incomplete. Anything more is superfluous. Documentation is not the place
        for witty turns of phrases and eloquent displays of wordplay. It is not
        designed to entertain, but rather to inform. Furthermore, to maximize
        its informational throughput, it must shed whatever is not needed - and
        it seems to me that everything you advocate for, such as its history and
        internal composition, is entirely unnecessary, perhaps even detrimental,
        to a library&apos;s own purpose.
      </blockquote>
      <p>
        To which I respond, dear reader, that when one wishes to learn about a
        topic, be it anything from history to mathematics, would he rather
        consult the encyclopedia, or the textbook? The reference, or the
        tutorial? The mere facts, or the teacher&apos;s guidance? It is only
        when one becomes an expert in a library that one can come to rely upon
        and properly utilize documentation that reads like a reference. It is
        only when a user knows what he is searching for, after having come to
        grips with the subject, that he finds the value in the emminently
        searchable, dry, succinct, and sterile content which references strive
        to provide. That to the novitiate of a library, what is considered{' '}
        <q>minimum viable necessary to accomplish his specified goal</q> is far
        different than a programmer wisened through prior experience. That for
        the most part, the complete novice does not even <em>truly know</em>{' '}
        what he wishes or expects from the library. He may be unfamiliar not
        only with how to interact with the library, but even the{' '}
        <em>very problem</em> the library sets out to solve.
      </p>
      <p>
        As such, a very different approach is required for the novitiate.
        Namely, that for each feature that a library aims to provide, a
        description of the problem which it aims to resolve is provided. That
        the obstacle which is to be surmounted is substantiated to the audience.
        That the story of how the problem came to fester, came to be realized,
        and came to be resolved is recounted. So this way, with the knowledge of
        the development details revealed to the user, he may gain in wisdom and
        come to an appreciation for why something might exist in the first
        place.
      </p>
      <h2>TBD...</h2>
    </>
  );
}
